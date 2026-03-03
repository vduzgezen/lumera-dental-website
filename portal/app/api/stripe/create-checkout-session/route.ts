// app/api/stripe/create-checkout-session/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

// Initialize Stripe (Auto-pins to your SDK's default API version)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { clinicId, amount, month, year } = await req.json();

    if (!clinicId || amount === undefined || !month || !year) {
      return NextResponse.json({ error: "Missing required billing parameters" }, { status: 400 });
    }

    // Calculate the exact date range for this billing cycle
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);

    // 1. Fetch the clinic
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId }
    });

    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // 2. Find or Create the Invoice in your database
    let invoice = await prisma.invoice.findFirst({
      where: {
        clinicId,
        periodStart: { gte: periodStart },
        periodEnd: { lte: periodEnd }
      }
    });

    if (invoice) {
      if (invoice.status === "PAID") {
         return NextResponse.json({ error: "This billing period is already paid." }, { status: 400 });
      }
      // Update the amount just in case new cases were added since they last viewed the page
      invoice = await prisma.invoice.update({
        where: { id: invoice.id },
        data: { amount }
      });
    } else {
      // Create a brand new invoice for this month
      const dueDate = new Date(periodEnd);
      dueDate.setDate(dueDate.getDate() + clinic.paymentTerms); // Usually +30 days

      invoice = await prisma.invoice.create({
        data: {
          clinicId,
          amount,
          periodStart,
          periodEnd,
          dueDate,
          status: "UNPAID"
        }
      });
    }

    // 3. Auto-create a Stripe Customer if this clinic doesn't have one yet
    let customerId = clinic.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: clinic.name,
        metadata: { lumeraClinicId: clinic.id }, 
      });
      customerId = customer.id;
      
      await prisma.clinic.update({
        where: { id: clinic.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // 4. Create the Embedded Checkout Session
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      customer: customerId as string, // ✅ Added type assertion just in case TS complains
      // ✅ Removed success_url and cancel_url because they are invalid in embedded mode
      payment_intent_data: {
        setup_future_usage: 'off_session', // Vault the card for future auto-pay!
      },
      // MAGIC LINK: We attach your database Invoice ID so the webhook knows what to update later
      client_reference_id: invoice.id,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Lumera Lab Invoice - ${month}/${year}`,
              description: `Billing period: ${periodStart.toLocaleDateString()} to ${periodEnd.toLocaleDateString()}`
            },
            unit_amount: Math.round(Number(amount) * 100), 
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      return_url: `${req.headers.get('origin')}/portal/billing?month=${month}&year=${year}&session_id={CHECKOUT_SESSION_ID}`,
    });

    return NextResponse.json({ clientSecret: session.client_secret });

  } catch (error: any) {
    console.error("Stripe Session Creation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
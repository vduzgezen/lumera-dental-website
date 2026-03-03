// app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
// This secret is used to verify the event actually came from Stripe
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    // Verify the cryptographic signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed:`, err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // Handle the specific event when a checkout is fully completed and paid
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // ✅ Grab the exact Invoice ID we attached during session creation
    const invoiceId = session.client_reference_id;

    if (invoiceId) {
      try {
        // ✅ Mark the invoice as PAID in your database!
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: { status: "PAID" },
        });
        
        console.log(`✅ SUCCESS: Invoice ${invoiceId} marked as PAID`);
      } catch (dbError) {
        console.error(`❌ Failed to update database:`, dbError);
      }
    }
  }

  // Always return a 200 OK to Stripe so they know we received the ping
  return NextResponse.json({ received: true });
}
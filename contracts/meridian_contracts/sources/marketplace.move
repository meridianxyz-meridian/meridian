/// Data marketplace — researchers purchase anonymized patient data.
/// 15% platform fee is taken atomically in the same PTB as the data purchase.
module meridian::marketplace {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::event;
    use std::string::String;
    use meridian::health_record::{Self, DataListing};

    // ── Constants ────────────────────────────────────────────────────────────
    const PLATFORM_FEE_BPS: u64 = 1500; // 15%
    const BPS_DENOMINATOR: u64 = 10000;
    const EListingInactive: u64 = 0;
    const EInsufficientPayment: u64 = 1;

    // ── Shared treasury ──────────────────────────────────────────────────────

    public struct Treasury has key {
        id: UID,
        admin: address,
        balance: u64,
    }

    public struct DataPurchased has copy, drop {
        listing_id: address,
        buyer: address,
        seller: address,
        amount_mist: u64,
        platform_fee_mist: u64,
    }

    /// One-time init — creates the shared treasury.
    fun init(ctx: &mut TxContext) {
        transfer::share_object(Treasury {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            balance: 0,
        });
    }

    /// Researcher purchases a data listing.
    /// Payment is split: seller gets 85%, treasury gets 15%.
    public entry fun purchase_data(
        listing: &DataListing,
        treasury: &mut Treasury,
        payment: Coin<SUI>,
        ctx: &mut TxContext,
    ) {
        assert!(health_record::listing_active(listing), EListingInactive);
        let price = health_record::listing_price(listing);
        assert!(coin::value(&payment) >= price, EInsufficientPayment);

        let fee = price * PLATFORM_FEE_BPS / BPS_DENOMINATOR;
        let seller_amount = price - fee;

        // Split coins and route them
        let mut payment_mut = payment;
        let fee_coin = coin::split(&mut payment_mut, fee, ctx);
        let seller_coin = coin::split(&mut payment_mut, seller_amount, ctx);

        // Return any overpayment to buyer
        let buyer = tx_context::sender(ctx);
        if (coin::value(&payment_mut) > 0) {
            transfer::public_transfer(payment_mut, buyer);
        } else {
            coin::destroy_zero(payment_mut);
        };

        treasury.balance = treasury.balance + fee;
        transfer::public_transfer(fee_coin, treasury.admin);
        // seller payment goes to listing owner — accessed via event for now
        // In production, DataListing would carry owner field accessible here
        transfer::public_transfer(seller_coin, buyer); // placeholder: replace with listing.owner

        event::emit(DataPurchased {
            listing_id: @0x0, // placeholder — pass listing ID as param in production
            buyer,
            seller: buyer,   // placeholder
            amount_mist: price,
            platform_fee_mist: fee,
        });
    }
}

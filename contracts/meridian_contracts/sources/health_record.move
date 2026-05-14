/// Core patient health record object — owned by the patient, never by a hospital.
/// Each record is a Sui owned object: only the patient's address can transfer or mutate it.
module meridian::health_record {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use std::string::{Self, String};
    use std::vector;

    // ── Errors ──────────────────────────────────────────────────────────────
    const ENotOwner: u64 = 0;
    const EConsentExpired: u64 = 1;

    // ── Core structs ────────────────────────────────────────────────────────

    /// A single medical record blob stored on Walrus.
    /// `walrus_blob_id` is the Walrus content-addressed blob ID.
    /// `seal_key_id`    is the Seal encryption key ID — only patient can decrypt.
    public struct HealthRecord has key {
        id: UID,
        owner: address,
        record_type: String,       // "lab", "imaging", "clinical_note", "prescription"
        walrus_blob_id: String,    // Walrus blob ID
        seal_key_id: String,       // Seal key ID for decryption
        timestamp: u64,
        metadata_hash: vector<u8>, // SHA-256 of plaintext metadata for integrity
    }

    /// A time-limited consent grant. Transferred to the grantee (doctor/provider).
    /// Expires at `expires_at` epoch ms — enforced on-chain.
    public struct ConsentGrant has key {
        id: UID,
        record_id: address,        // ID of the HealthRecord this grant covers
        grantor: address,          // patient
        grantee: address,          // doctor / provider
        seal_decryption_key: String, // time-limited decryption key from Seal
        expires_at: u64,           // epoch ms
        access_type: String,       // "read_once", "read_timed"
    }

    /// A data sale listing on the marketplace.
    public struct DataListing has key {
        id: UID,
        owner: address,
        anonymized_blob_id: String, // Walrus blob of anonymized data
        data_category: String,      // "diabetes_glucose", "cardio_ecg", etc.
        price_mist: u64,            // price in MIST (1 SUI = 1e9 MIST)
        study_id: String,           // research study identifier
        active: bool,
    }

    // ── Events ───────────────────────────────────────────────────────────────

    public struct RecordUploaded has copy, drop {
        record_id: address,
        owner: address,
        record_type: String,
        walrus_blob_id: String,
    }

    public struct ConsentGranted has copy, drop {
        grant_id: address,
        grantor: address,
        grantee: address,
        expires_at: u64,
    }

    public struct ConsentRevoked has copy, drop {
        grant_id: address,
        grantor: address,
    }

    public struct DataListingCreated has copy, drop {
        listing_id: address,
        owner: address,
        data_category: String,
        price_mist: u64,
    }

    // ── Record management ────────────────────────────────────────────────────

    /// Patient uploads a new health record. The record object is owned by the patient.
    public entry fun upload_record(
        record_type: vector<u8>,
        walrus_blob_id: vector<u8>,
        seal_key_id: vector<u8>,
        metadata_hash: vector<u8>,
        ctx: &mut TxContext,
    ) {
        let owner = tx_context::sender(ctx);
        let record = HealthRecord {
            id: object::new(ctx),
            owner,
            record_type: string::utf8(record_type),
            walrus_blob_id: string::utf8(walrus_blob_id),
            seal_key_id: string::utf8(seal_key_id),
            timestamp: tx_context::epoch_timestamp_ms(ctx),
            metadata_hash,
        };
        event::emit(RecordUploaded {
            record_id: object::uid_to_address(&record.id),
            owner,
            record_type: record.record_type,
            walrus_blob_id: record.walrus_blob_id,
        });
        transfer::transfer(record, owner);
    }

    // ── Consent management ───────────────────────────────────────────────────

    /// Patient grants a time-limited consent to a provider.
    /// The ConsentGrant object is transferred to the grantee.
    public entry fun grant_consent(
        record: &HealthRecord,
        grantee: address,
        seal_decryption_key: vector<u8>,
        expires_at: u64,
        access_type: vector<u8>,
        ctx: &mut TxContext,
    ) {
        assert!(tx_context::sender(ctx) == record.owner, ENotOwner);
        let grant = ConsentGrant {
            id: object::new(ctx),
            record_id: object::uid_to_address(&record.id),
            grantor: record.owner,
            grantee,
            seal_decryption_key: string::utf8(seal_decryption_key),
            expires_at,
            access_type: string::utf8(access_type),
        };
        event::emit(ConsentGranted {
            grant_id: object::uid_to_address(&grant.id),
            grantor: record.owner,
            grantee,
            expires_at,
        });
        transfer::transfer(grant, grantee);
    }

    /// Patient revokes a consent grant by destroying it.
    public entry fun revoke_consent(grant: ConsentGrant, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == grant.grantor, ENotOwner);
        event::emit(ConsentRevoked {
            grant_id: object::uid_to_address(&grant.id),
            grantor: grant.grantor,
        });
        let ConsentGrant { id, record_id: _, grantor: _, grantee: _, seal_decryption_key: _, expires_at: _, access_type: _ } = grant;
        object::delete(id);
    }

    /// Verify a consent grant is still valid (not expired).
    public fun verify_consent(grant: &ConsentGrant, ctx: &TxContext): bool {
        tx_context::epoch_timestamp_ms(ctx) < grant.expires_at
    }

    // ── Data marketplace ─────────────────────────────────────────────────────

    /// Patient creates a data listing for anonymized research data.
    public entry fun create_listing(
        anonymized_blob_id: vector<u8>,
        data_category: vector<u8>,
        price_mist: u64,
        study_id: vector<u8>,
        ctx: &mut TxContext,
    ) {
        let owner = tx_context::sender(ctx);
        let listing = DataListing {
            id: object::new(ctx),
            owner,
            anonymized_blob_id: string::utf8(anonymized_blob_id),
            data_category: string::utf8(data_category),
            price_mist,
            study_id: string::utf8(study_id),
            active: true,
        };
        event::emit(DataListingCreated {
            listing_id: object::uid_to_address(&listing.id),
            owner,
            data_category: listing.data_category,
            price_mist,
        });
        transfer::transfer(listing, owner);
    }

    /// Deactivate a listing.
    public entry fun deactivate_listing(listing: &mut DataListing, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == listing.owner, ENotOwner);
        listing.active = false;
    }

    // ── Accessors ────────────────────────────────────────────────────────────

    public fun record_owner(r: &HealthRecord): address { r.owner }
    public fun record_blob_id(r: &HealthRecord): &String { &r.walrus_blob_id }
    public fun grant_expires_at(g: &ConsentGrant): u64 { g.expires_at }
    public fun grant_grantee(g: &ConsentGrant): address { g.grantee }
    public fun listing_price(l: &DataListing): u64 { l.price_mist }
    public fun listing_active(l: &DataListing): bool { l.active }
}

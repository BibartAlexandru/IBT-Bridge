module ibt_token_package::ibt_token;
use sui::token::{Self,ActionRequest,Token};
use sui::coin::{Self,Coin,TreasuryCap};
use sui::table::{Self,Table};

public struct IBT_TOKEN has drop {}

public struct Balances has key,store{
    id: UID,
    balances: Table<address,u64>
}

// e ca si constructorul unui contract in eth, doar deployerul ii da call on deploy
fun init(witness: IBT_TOKEN, ctx: &mut TxContext){
    // treasury e un token factory cu care poti crea tokene (similar cu un factory singleton)
    // ctx are senderul in el
    let (treasury, metadata) = coin::create_currency(
        witness,
        18, // nr de decimale
        b"IBT",
        b"IBT Token",
        b"",
        option::none(), 
        ctx
    );


    // asta face metadata-ul tokenului immutable de aici in jos
    transfer::public_freeze_object(metadata);
    // in sui conturile pot detine smart contracts
    // aici deployerul primeste factory-ul de tokene    
    transfer::public_transfer(treasury, ctx.sender());

    //
    let balances = Balances { 
        id: object::new(ctx),
        balances: table::new(ctx)
    };
    transfer::public_transfer(balances,ctx.sender());
}

public fun mint(
    treasury_cap: &mut TreasuryCap<IBT_TOKEN>,
    amount: u64, 
    recipient: address,
    ctx: &mut TxContext,
    balances: &mut Balances
){
    if(ctx.sender() != recipient)
        return;
    let token = token::mint(treasury_cap, amount, ctx);
    let req = token::transfer(token, recipient, ctx);
    token::confirm_with_treasury_cap(treasury_cap, req, ctx);
    
    let mut recip_balance = balances.balances.borrow_mut(recipient);
    *recip_balance = *recip_balance + amount;
}

// public fun get_balance(ctx: &TxContext, account: address, treasury_cap: &mut TreasuryCap<IBT_TOKEN>){
//     let coins = treasury_cap.
// }


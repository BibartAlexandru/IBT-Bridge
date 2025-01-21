module ibt_token_package::ibt_token;
use sui::token::{Self,ActionRequest,Token};
use sui::coin::{Self,Coin,TreasuryCap};
use sui::table::{Self,Table};

public struct IBT_TOKEN has drop {}

public struct DeployerObj has key{
    id: sui::object::UID
}

// e ca si constructorul unui contract in eth, doar deployerul ii da call on deploy
fun init(witness: IBT_TOKEN, ctx: &mut TxContext){
    // treasury e un token factory cu care poti crea/burnui tokene
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

    //obiectul asta il atesta ca esti deployerul contractului, folosit
    //la verif de mint si burn
    let deployer_obj = DeployerObj{
        id: sui::object::new(ctx)
    };
    transfer::transfer(deployer_obj, ctx.sender());

    // asta face metadata-ul tokenului immutable de aici in jos
    transfer::public_freeze_object(metadata);
    // aici deployerul primeste factory-ul de tokene    
    transfer::public_transfer(treasury, ctx.sender());
    transfer::public_share_object(metadata);
}

public fun mint(
    amount: u64, 
    cap: &mut TreasuryCap<IBT_TOKEN>,
    recipient: address,
    ctx: &mut TxContext,
    _deployer_obj: &DeployerObj,
){
    let token = token::mint(cap, amount, ctx);
    let req = token::transfer(token, recipient, ctx);
    token::confirm_with_treasury_cap(cap, req, ctx);
}

public fun burn(
    amount: u64,
    sender_coins: vector<Coin<IBT_TOKEN>>,
    ctx: &mut TxContext,
    cap: &mut TreasuryCap<IBT_TOKEN>,
): bool{
    if(balance(sender_coins) < amount)
        return false;
    let mut merged_coin = sender_coins.pop_back();
    while(coin::balance(&merged_coin).value() < amount){
        let last_coin = sender_coins.pop_back();
        coin::join(&mut merged_coin, last_coin);
    }
    if(coin::balance(&merged_coin).value() > amount){
        let split_amt_coin = coin::split(&mut merged_coin, amount, ctx);
        coin::burn(cap,split_amt_coin);
    }
    else
        coin::burn(cap, merged_coin);
    return true;
}

//oricine-si poate vedea balanta 
public fun balance(
    coins: vector<Coin<IBT_TOKEN>>
): u64{
   let b = coins.fold!(0, |acc, c| acc + coin::balance(&c).value());
   b
}




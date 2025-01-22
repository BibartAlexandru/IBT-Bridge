module ibt_token_package::ibt_token{
    use sui::token::{Self};
    use sui::coin::{Self,Coin,TreasuryCap};

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
        coin::mint_and_transfer(cap, amount, recipient, ctx);
        // let token = token::mint(cap, amount, ctx);
        // let req = token::transfer(token, recipient, ctx);
        // token::confirm_with_treasury_cap(cap, req, ctx);
    }

    public fun burn(
        amount: u64,
        recipient: address,
        recipient_coins: &mut vector<Coin<IBT_TOKEN>>,
        ctx: &mut TxContext,
        cap: &mut TreasuryCap<IBT_TOKEN>,
        _deployer_obj: &DeployerObj,
    ): bool{
        if(balance(recipient_coins) < amount)
            return false;
        let mut merged_coin = recipient_coins.pop_back();
        while(coin::balance(& merged_coin).value() < amount){
            let last_coin = recipient_coins.pop_back();
            coin::join(&mut merged_coin, last_coin);
        };

        if(coin::balance(& merged_coin).value() > amount){
            let split_amt_coin = coin::split(&mut merged_coin, amount, ctx);
            coin::burn(cap,split_amt_coin);

            let (token,transform_req) = token::from_coin(merged_coin, ctx);
            token::confirm_with_treasury_cap(cap, transform_req, ctx);
            
            let req = token::transfer(token, recipient, ctx);
            token::confirm_with_treasury_cap(cap, req, ctx);
        }
        else{
            coin::burn(cap, merged_coin);
        };
        true
    }

    //oricine-si poate vedea balanta 
    public fun balance(
        coins: &mut vector<Coin<IBT_TOKEN>>
    ): u64{
        let mut bal = 0 ;
        let mut i = 0;
        while(i < coins.length()){
            bal = bal + coin::balance(&coins[i]).value();
            i = i+1 ;
        };
        bal
    }

    //gasit aici
    //https://www.youtube.com/watch?v=Nxcwq62VKWM&ab_channel=RiseIn
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext){
        init(IBT_TOKEN{}, ctx);
    }
}


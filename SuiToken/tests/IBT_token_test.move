#[test_only]
module test_package::IBT_token_test{
    use ibt_token_package::ibt_token;
    use ibt_token_package::ibt_token::{IBT_TOKEN};
    use sui::test_scenario;
    use sui::coin::{TreasuryCap,Coin};
    use sui::token::Token;

    const OBJECT_NOT_SENT: u64 = 0 ;
    const WRONG_COIN_AMOUNT: u64 = 2 ;
    
    #[test]
    fun test_create(){
        let owner = @0xA ;

        let mut scenario_val = test_scenario::begin(owner);
        let scenario = &mut scenario_val; 

        //INIT CALL
        test_scenario::next_tx(scenario, owner);
        {
            ibt_token::init_for_testing(test_scenario::ctx(scenario));
        };

        //VERIF TREASURY CUP
        test_scenario::next_tx(scenario, owner);
        {
            //has_most_recent => verifica ultimu obiect transferat
            assert!(test_scenario::has_most_recent_for_sender<TreasuryCap<IBT_TOKEN>>(scenario), OBJECT_NOT_SENT);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_mint(){
        let owner = @0xA;
        let other = @0xB;

        let mut scenario_val = test_scenario::begin(owner);
        let scenario = &mut scenario_val;

        //INIT CALL
        test_scenario::next_tx(scenario, owner);
        {
            ibt_token::init_for_testing(test_scenario::ctx(scenario));
        };

        //OWNER SELF MINT
        test_scenario::next_tx(scenario, owner);
        {
            let mut cap = test_scenario::take_from_sender<TreasuryCap<IBT_TOKEN>>(scenario);
            ibt_token::mint(20, &mut cap, owner, test_scenario::ctx(scenario));
            test_scenario::return_to_sender(scenario, cap);
        };

        //OWNER SELF MINT CHECK
        test_scenario::next_tx(scenario, owner);
        {
            assert!(test_scenario::has_most_recent_for_address<Coin<IBT_TOKEN>>(owner), OBJECT_NOT_SENT);
            let minted_coin = test_scenario::take_from_sender<Coin<IBT_TOKEN>>(scenario);
            assert!(minted_coin.value() == 20, WRONG_COIN_AMOUNT);
            test_scenario::return_to_sender(scenario, minted_coin);

        };

        //OWNER MINT FOR OTHER
        test_scenario::next_tx(scenario, owner);
        {
            let mut cap = test_scenario::take_from_sender<TreasuryCap<IBT_TOKEN>>(scenario);
            ibt_token::mint(420, &mut cap, other, test_scenario::ctx(scenario));
            test_scenario::return_to_sender(scenario, cap);
        };

        //CHECK MINT FOR OTHER
        test_scenario::next_tx(scenario, owner);
        {
            assert!(test_scenario::has_most_recent_for_address<Coin<IBT_TOKEN>>(other), OBJECT_NOT_SENT);
            let minted_coin = test_scenario::take_from_address<Coin<IBT_TOKEN>>(scenario, other);
            assert!(minted_coin.value() == 420, WRONG_COIN_AMOUNT);
            test_scenario::return_to_address(other, minted_coin);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_burn_full(){
        let owner = @0xA ;
        let user = @0xB;

        let mut scenario_val = test_scenario::begin(owner);
        let scenario = &mut scenario_val;

        //INIT CALL
        test_scenario::next_tx(scenario, owner);
        {
            ibt_token::init_for_testing(test_scenario::ctx(scenario));
        };

        //MINT 50 TO USER
        test_scenario::next_tx(scenario, owner);
        {
            let mut cap = test_scenario::take_from_sender<TreasuryCap<IBT_TOKEN>>(scenario);
            ibt_token::mint(50, &mut cap, user, test_scenario::ctx(scenario));
            test_scenario::return_to_sender(scenario, cap);
        };
        
        //BURN 50 FROM USER
        test_scenario::next_tx(scenario,owner);
        {
            let c = test_scenario::take_from_address<Coin<IBT_TOKEN>>(scenario, user);
            let mut cap = test_scenario::take_from_sender<TreasuryCap<IBT_TOKEN>>(scenario);
            let mut user_coins = vector<Coin<IBT_TOKEN>>[c];
            ibt_token::burn(50, user, &mut user_coins, test_scenario::ctx(scenario), &mut cap);
            test_scenario::return_to_sender(scenario, cap);
            
            while(user_coins.length() > 0){
                let last_coin = user_coins.pop_back();
                test_scenario::return_to_address(user, last_coin);
            };
            vector::destroy_empty(user_coins);
        };

        //CHECK IF STILL HAS TOKENs
        test_scenario::next_tx(scenario, owner);
        {
            assert!(test_scenario::ids_for_address<Coin<IBT_TOKEN>>(user).is_empty(),3);
        };

        test_scenario::end(scenario_val);
    }


     #[test]
    fun test_burn_partial(){
        let owner = @0xA ;
        let user = @0xB;

        let mut scenario_val = test_scenario::begin(owner);
        let scenario = &mut scenario_val;

        //INIT CALL
        test_scenario::next_tx(scenario, owner);
        {
            ibt_token::init_for_testing(test_scenario::ctx(scenario));
        };

        //MINT 50 TO USER
        test_scenario::next_tx(scenario, owner);
        {
            let mut cap = test_scenario::take_from_sender<TreasuryCap<IBT_TOKEN>>(scenario);
            ibt_token::mint(50, &mut cap, user, test_scenario::ctx(scenario));
            test_scenario::return_to_sender(scenario, cap);
        };
        
        //BURN 25 FROM USER
        test_scenario::next_tx(scenario,owner);
        {
            let c = test_scenario::take_from_address<Coin<IBT_TOKEN>>(scenario, user);
            let mut cap = test_scenario::take_from_sender<TreasuryCap<IBT_TOKEN>>(scenario);
            let mut user_coins = vector<Coin<IBT_TOKEN>>[c];
            ibt_token::burn(25, user, &mut user_coins, test_scenario::ctx(scenario), &mut cap);
            test_scenario::return_to_sender(scenario, cap);
            while(user_coins.length() > 0){
                let last_coin = user_coins.pop_back();
                test_scenario::return_to_address(user, last_coin);
            };
            vector::destroy_empty(user_coins);
        };

        //CHECK IF HAS TOKEN with amount 25
        test_scenario::next_tx(scenario, owner);
        {
            assert!(!test_scenario::ids_for_address<Coin<IBT_TOKEN>>(user).is_empty(),3);
            let remaining_coin = test_scenario::take_from_address<Coin<IBT_TOKEN>>(scenario,user);
            assert!(remaining_coin.value() == 25, 4) ;
            test_scenario::return_to_address(user, remaining_coin);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_burn_more_coins(){
        let owner = @0xA ;
        let user = @0xB;

        let mut scenario_val = test_scenario::begin(owner);
        let scenario = &mut scenario_val;

        //INIT CALL
        test_scenario::next_tx(scenario, owner);
        {
            ibt_token::init_for_testing(test_scenario::ctx(scenario));
        };

        //MINT 50 TO USER
        test_scenario::next_tx(scenario, owner);
        {
            let mut cap = test_scenario::take_from_sender<TreasuryCap<IBT_TOKEN>>(scenario);
            ibt_token::mint(50, &mut cap, user, test_scenario::ctx(scenario));
            test_scenario::return_to_sender(scenario, cap);
        };

        //MINT 20 TO USER
        test_scenario::next_tx(scenario, owner);
        {
            let mut cap = test_scenario::take_from_sender<TreasuryCap<IBT_TOKEN>>(scenario);
            ibt_token::mint(20, &mut cap, user, test_scenario::ctx(scenario));
            test_scenario::return_to_sender(scenario, cap);
        };

        //MINT 10 TO USER
        test_scenario::next_tx(scenario, owner);
        {
            let mut cap = test_scenario::take_from_sender<TreasuryCap<IBT_TOKEN>>(scenario);
            ibt_token::mint(10, &mut cap, user, test_scenario::ctx(scenario));
            test_scenario::return_to_sender(scenario, cap);
        };
        
        //BURN 60 FROM USER
        test_scenario::next_tx(scenario,owner);
        {
            let coin_ids = test_scenario::ids_for_address<Coin<IBT_TOKEN>>(user);
            let mut user_coins: vector<Coin<IBT_TOKEN>> =  coin_ids.map!(|id| test_scenario::take_from_address_by_id(scenario, user, id));
            assert!(user_coins.length() == 3, 10);
            let mut cap = test_scenario::take_from_sender<TreasuryCap<IBT_TOKEN>>(scenario);
            ibt_token::burn(60, user, &mut user_coins, test_scenario::ctx(scenario), &mut cap);
            test_scenario::return_to_sender(scenario, cap);
            while(user_coins.length() > 0){
                let last_coin = user_coins.pop_back();
                test_scenario::return_to_address(user, last_coin);
            };
            vector::destroy_empty(user_coins);
        };

        //CHECK IF HAS 20 COINS LEFT after burn
        test_scenario::next_tx(scenario, owner);
        {
            let coin_ids = test_scenario::ids_for_address<Coin<IBT_TOKEN>>(user);
            let mut remaining_coins: vector<Coin<IBT_TOKEN>> =  coin_ids.map!(|id| test_scenario::take_from_address_by_id(scenario, user, id));
            assert!(remaining_coins.length() != 0,3);
            let mut remaining_balance = 0 ;
            while(remaining_coins.length() > 0){
                let last_coin = remaining_coins.pop_back();
                remaining_balance = remaining_balance + last_coin.value();
                test_scenario::return_to_address(user, last_coin);
            };
            assert!(remaining_balance == 20, 4);
            vector::destroy_empty(remaining_coins);
        };

        test_scenario::end(scenario_val);

    }
}
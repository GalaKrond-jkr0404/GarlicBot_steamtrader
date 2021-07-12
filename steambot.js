"use strict";
const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const SteamCommunity = require('steamcommunity');
const TradeOfferManager = require('steam-tradeoffer-manager');
const config = require('./config.json');
const prices = require('./prices.json');
const client = new SteamUser();

const community = new SteamCommunity();
const manager = new TradeOfferManager({
	steam: client,
	community: community,
	language: 'en'
});



//로그인 + 코드가져오기
const logonOptions = {
	accountName: config.username,
	password: config.password,
	twoFactorCode: SteamTotp.generateAuthCode(config.sharedSecret)

};

client.logOn(logonOptions);

client.on('loggedOn', () => {
	console.log(' GarlicBot successfully logged on. ');
	client.setPersona(SteamUser.EPersonaState.Online);
	client.gamesPlayed(["Online Now!",440]);
}); 

client.on("friendMessage", function(steamID, message) {
	if (message == "hi") {
		client.chatMessage(steamID, "hello! GarlicBot Online!")
	}
	else if (message == "!info") {
		client.chatMessage(steamID, "GarlicBot is automated / self-Made Steam Trading Bot, Made By _GalaKrond :)")
	}


});

client.on('webSession', (sessionid, cookies) => {
	manager.setCookies(cookies);

	community.setCookies(cookies);
	community.startConfirmationsChecker(20000, config.identitySecret);


})
//거래 허락 
function acceptOffer(offer) {
	offer.accept(function(err, status) {
		if (err) {
			console.log("Unable to accept offer: " + err.message);
		} else {
			console.log("Offer accepted: " + status);
			if (status == "pending") {
				community.acceptConfirmationForObject("//identitySecret", offer.id, function(err) {
					if (err) {
						console.log("Can't confirm trade offer: " + err.message);
					} else {
						console.log("Trade offer " + offer.id + " confirmed");
					}
				});
			}
		}
	});
}

//거래 거부 
function declineOffer(offer) {
	offer.decline((err) => {
		console.log ("decline the offer :)");
		if (err) console.log ("That was an error :(  decline offer....");
	}); 
}




//거래 진행 
function processOffer(offer) {
	if(offer.isGlitched() || offer.state === 11) {
		console.log("This offer is Glitched! decline.");
		declineOffer(offer);
	} 

	else if (offer.partner.getSteamID64() === config.ownerID) {
		console.log("Accept offer from owner :)")
		acceptOffer(offer);
	}

	else{
		var ourItems = offer.itemsToGive;
		var theirItems = offer.itemsToReceive;
		var ourValue = 0 ;
		var theirValue = 0;
		
			
			for (var i = 0; i < ourItems.length; i++) { var j = ourItems[i]; //내 아이템들과 그의 값어치
            var item = j.market_hash_name
            console.log(i + "번째 내 item :" + item)
            if(prices[item]) {
            	ourValue += prices[item].sell; 
			} 
			else {
				console.log("invaild Value.");
					ourValue += 99999; //초과가 불가능한 값어치로 구매 불가능하게 만들기
			}
        }



		for (var k = 0; k < theirItems.length; k++) { var l = theirItems[k]; //상대의 아이템들과 그의 값어치
            var items = l.market_hash_name
            console.log(k + "번째 상대의 item :" + items)
            if(prices[items]) {
            	theirValue += prices[item].buy;
			} 
			else {
				console.log("Their Values was Different.");
			}
        }





		console.log("Our value: "+ ourValue);
		console.log("Their value:"+ theirValue);


		if(ourValue <= theirValue) {
			acceptOffer(offer);
		}

		else {
			declineOffer(offer);
		}
	}

}


client.setOption("promptSteamGuardCode", false);

manager.on('newOffer', (offer) => {
	processOffer(offer);
});
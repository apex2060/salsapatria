var it = {};

angular.module('myApp', [])
.factory('config', function ($http, $q) {
	var config = {
		parse: {
			root: 		'https://api.parse.com/1',
			appId: 		'rUfzCG35HtmuE6AwkTLhRb3GI82wnJNATaGqupiY',
			jsKey: 		'mWj4liU55buoYI5XovFgvlCw8V2fvL5dePU9pVg4',
			restKey: 	'ClooZKpYkNO3mzpuqkCraB4JElRfUmafoYeCopvr'
		},
		stripe: 		'pk_test_35wbDEYP6xWfCmnT4SUqW9Rc',
		// stripe: 		'pk_live_CBDg0xob30YY1s1kP1tivz0j',
	}
	$http.defaults.headers.common['X-Parse-Application-Id'] = config.parse.appId;
	$http.defaults.headers.common['X-Parse-REST-API-Key'] = config.parse.restKey;
	$http.defaults.headers.common['Content-Type'] = 'application/json';
	
	return config;
})
.controller('MainCtrl', function($scope, $http, config) {
	$http.get(config.parse.root+'/classes/Products').success(function(data){
		var store = $scope.store = {
			items: data.results
		}
	})
	
	var tools = $scope.tools = {
		message: {
			send: function(msgData){
				$http.post('https://api.parse.com/1/functions/contactUs', msgData).success(function(r){
					alert('Thanks for your message!  We will get back with you shortly.')
				}).error(function(e){
					alert('Sorry, there was a problem sending your message.')
				})
			}
		},
		cart: {
			clean: function(){
				$scope.cart = {items: [], quantity: 0, subTotal: 0, shipping: 0, discount: 0,  total: 0}
				tools.cart.localSave();
			},
			localSave: function(){
				// localStorage.setItem('cart',  angular.toJson($scope.cart))
			},
			add: function(item){
				var i = $scope.cart.items.indexOf(item);
				if(i == -1){
					item.quantity = 1;
					$scope.cart.items.push(item)
				}else{
					item.quantity++;
				}
				$scope.cart.quantity++;
				$scope.cart.subTotal += item.price;
				$scope.cart.shipping += item.shipping;
				$scope.cart.total 	= $scope.cart.subTotal + $scope.cart.shipping;
				$scope.shipping 	= null;
				
				tools.cart.localSave();
			},
			remove: function(item){
				var i = $scope.cart.items.indexOf(item);
				if(i != -1)
					if(item.quantity > 0)
						item.quantity--
				if(i>-1 && item.quantity == 0)
					$scope.cart.items.splice(i, 1)
					
				$scope.cart.quantity--;
				$scope.cart.subTotal -= item.price;
				$scope.cart.shipping -= item.shipping;
				$scope.cart.total 	= $scope.cart.subTotal + $scope.cart.shipping;
				$scope.shipping 	= null;
				
				tools.cart.localSave();
			},
			calculate: function(){
				var elig = it.elig = 0;
				for(var i=0; i<$scope.cart.items.length; i++)
					if($scope.cart.items[i].discount)
						elig += $scope.cart.items[i].quantity;
				if(elig >= 12)
					$scope.cart.discount = 10;
					
				$scope.cart.total = ($scope.cart.subTotal + $scope.cart.shipping - $scope.cart.discount);
				$scope.shipping = $scope.cart.shipping;
				$scope.discount = $scope.cart.discount;
				$scope.total = $scope.cart.total;
			},
			checkout: function(){
				tools.cart.calculate();
				var cart = angular.copy($scope.cart);
					cart.pennies 		= Math.round(cart.total * 100);
					cart.description 	= cart.quantity + ' Item(s)';
					
				var handler = StripeCheckout.configure({
					key: config.stripe,
					image: '/img/logos/salsalogo.jpg',
					locale: 'auto',
					token: function(token) {
						var payload = {
							customer: {},
							cart: cart,
							charge: token,
							pennies: cart.pennies
						}
						$http.post('https://api.parse.com/1/functions/placeOrder', payload)
							.success(function(response){
								tools.cart.clean();
							}).error(function(e){
								console.error(e);
							})
					}
				});
				handler.open({
					name: 'Salsa Patria',
					description: cart.description,
					amount: cart.pennies,
					shippingAddress: true
				});
			}
		}
	}
	
	$scope.cart = angular.fromJson(localStorage.getItem('cart'))
	if(!$scope.cart)
		tools.cart.clean()
		
	it.MainCtrl = $scope;
})

.controller('AdminCtrl', function($scope, $http, $location, config) {
	$http.get(config.parse.root+'/classes/Orders/'+$location.search().id).success(function(order){
		$scope.order = order;
	});
	it.AdminCtrl = $scope;
})
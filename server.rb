require 'sinatra'
require 'sinatra/reloader'
require 'sinatra/json'
require 'twilio-ruby'

# Set your server to puma
configure { set :server, :puma }

class VideoApp < Sinatra::Base

  # Reload the server when you change code in this file
  configure :development do
    register Sinatra::Reloader
  end

  get '/' do
    erb :video
  end

  post '/token' do
    request_body = JSON.parse(request.body.read)

    # Handle error if no username was passed into the request
    if request_body['username'].nil?
      halt 400, 'No username in request'
    end

    # Get the username from the request
    @username = request_body['username']

    twilio_account_sid = ENV['TWILIO_ACCOUNT_SID']
    twilio_api_key_sid = ENV['TWILIO_API_KEY_SID']
    twilio_api_key_secret = ENV['TWILIO_API_KEY_SECRET']

    # Create an access token
    token = Twilio::JWT::AccessToken.new(twilio_account_sid, twilio_api_key_sid, twilio_api_key_secret, [], identity: @username);

    # Create Video grant for your token
    grant = Twilio::JWT::AccessToken::VideoGrant.new
    grant.room = 'My Video Room'
    token.add_grant(grant)

    # Generate and return the token as a JSON response
    json status: 200, token: token.to_jwt
  end

end
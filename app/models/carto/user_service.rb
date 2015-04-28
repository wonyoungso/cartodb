# encoding: UTF-8

require 'active_record'

module Carto
  class UserService

    AUTH_DIGEST = '47f940ec20a0993b5e9e4310461cc8a6a7fb84e3'

    def initialize(user_model)
      @user = user_model
    end

    def database_username
      if Rails.env.production?
        "cartodb_user_#{@user.id}"
      elsif Rails.env.staging?
        "cartodb_staging_user_#{@user.id}"
      else
        "#{Rails.env}_cartodb_user_#{@user.id}"
      end
    end

    # TODO: Migrate remaining
    def in_database(options = {}, &block)
      if options[:statement_timeout]
        # TODO: See if this has any effect, probably not as it is  retrieving a new connection each time
        in_database.execute("SET statement_timeout TO #{options[:statement_timeout]}")
      end

      connection = get_database(options)

      if block_given?
        yield(connection)
      else
        connection
      end
    end

    def self.password_digest(password, salt)
      digest = AUTH_DIGEST
      10.times do
        digest = secure_digest(digest, salt, password, AUTH_DIGEST)
      end
      digest
    end

    def self.make_token
      secure_digest(Time.now, (1..10).map{ rand.to_s })
    end

    private

    def self.secure_digest(*args)
      Digest::SHA1.hexdigest(args.flatten.join('--'))
    end

    def database_password
      @user.crypted_password + database_username
    end

    def database_public_username
      (@user.database_schema != CartoDB::DEFAULT_DB_SCHEMA) ? "cartodb_publicuser_#{@user.id}" : CartoDB::PUBLIC_DB_USER
    end

    def get_database(options)
      #TODO: Sequel one also sets search_path after connecting      
      resolver = ActiveRecord::Base::ConnectionSpecification::Resolver.new(
          get_db_configuration_for(options[:as]), 
          get_connection_name(options[:as])
        )
      ActiveRecord::Base.connection_handler.establish_connection(
          get_connection_name(options[:as]), 
          resolver.spec
        ).connection
    end

    def get_connection_name(kind = :user_model)
      kind.to_s
    end

    def get_db_configuration_for(user_type = nil)
      logger = (Rails.env.development? || Rails.env.test? ? ::Rails.logger : nil)

      # TODO: proper AR config when migration is complete
      base_config = ::Rails::Sequel.configuration.environment_for(Rails.env)

      config = {
        adapter:  "postgresql",
        logger:   logger,
        host:     @user.database_host,
        username: base_config['username'],
        password: base_config['password'],
        database: @user.database_name
      }

      if user_type == :superuser
        # Nothing needed
        config
      elsif user_type == :cluster_admin
        config.merge({
            database: 'postgres'
          })
      elsif user_type == :public_user
        config.merge({
            username: CartoDB::PUBLIC_DB_USER,
            password: CartoDB::PUBLIC_DB_USER_PASSWORD
          })
      elsif user_type == :public_db_user
        config.merge({
            username: database_public_username,
            password: CartoDB::PUBLIC_DB_USER_PASSWORD
          })
      else
        config.merge({
            username: database_username,
            password: database_password,
          })
      end
    end

    def load_cartodb_functions
      #TODO: Implement
    end

    def rebuild_quota_trigger
      #TODO: Implement
    end

  end
end
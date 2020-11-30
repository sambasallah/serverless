'use strict';

const chai = require('chai');
const AwsProvider = require('../../../../../../lib/plugins/aws/provider/awsProvider');
const validate = require('../../../../../../lib/plugins/aws/lib/validate');
const Serverless = require('../../../../../../lib/Serverless');

chai.use(require('chai-as-promised'));

const expect = chai.expect;

describe('#validate', () => {
  const serverless = new Serverless();
  let provider;
  const awsPlugin = {};

  beforeEach(() => {
    awsPlugin.options = {
      stage: 'dev',
      region: 'us-east-1',
    };
    provider = new AwsProvider(serverless, awsPlugin.options);
    provider.cachedCredentials = {
      credentials: { accessKeyId: 'foo', secretAccessKey: 'bar' },
    };
    awsPlugin.provider = provider;
    awsPlugin.serverless = serverless;
    awsPlugin.serverless.setProvider('aws', provider);

    awsPlugin.serverless.config.servicePath = true;
    serverless.processedInput = { commands: ['deploy'] };

    Object.assign(awsPlugin, validate);
  });

  describe('#validate()', () => {
    it('should succeed if inside service (servicePath defined)', () =>
      expect(() => awsPlugin.validate()).not.to.throw());

    it('should throw error if not inside service (servicePath not defined)', () => {
      awsPlugin.serverless.config.servicePath = false;
      return expect(() => awsPlugin.validate()).to.throw(
        serverless.classes.Error,
        /can only be run inside a service directory/
      );
    });

    // NOTE: starting here, test order is important

    it('should default to "dev" if stage is not provided', () => {
      awsPlugin.options.stage = false;
      expect(() => awsPlugin.validate()).not.to.throw();
      expect(awsPlugin.provider.getStage()).to.equal('dev');
    });

    it('should use the service.provider stage if present', () => {
      awsPlugin.options.stage = false;
      awsPlugin.serverless.service.provider = {
        stage: 'some-stage',
      };

      expect(() => awsPlugin.validate()).not.to.throw();
      expect(awsPlugin.provider.getStage()).to.equal('some-stage');
    });

    it('should default to "us-east-1" region if region is not provided', () => {
      awsPlugin.options.region = false;
      expect(() => awsPlugin.validate()).not.to.throw();
      expect(awsPlugin.options.region).to.equal('us-east-1');
    });

    it('should use the service.provider region if present', () => {
      awsPlugin.options.region = false;
      awsPlugin.serverless.service.provider = {
        region: 'some-region',
      };

      expect(() => awsPlugin.validate()).not.to.throw();
      expect(awsPlugin.options.region).to.equal('some-region');
    });
  });
});

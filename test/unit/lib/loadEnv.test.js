'use strict';

const chai = require('chai');
const path = require('path');
const sinon = require('sinon');
const overrideEnv = require('process-utils/override-env');
const fs = require('fs');
const loadEnv = require('../../../lib/loadEnv');
const dotenv = require('dotenv');
const ServerlessError = require('../../../lib/classes/Error').ServerlessError;

chai.use(require('chai-as-promised'));
const expect = require('chai').expect;

describe('loadEnv', () => {
  let restoreEnv;

  before(async () => {
    const stage = 'testing';
    const stageFileContent = 'FROM_STAGE=valuefromstage';
    await fs.promises.writeFile(path.join(process.cwd(), `.env.${stage}`), stageFileContent);

    const defaultFileContent = 'FROM_DEFAULT=valuefromdefault';
    await fs.promises.writeFile(path.join(process.cwd(), '.env'), defaultFileContent);
  });

  beforeEach(() => {
    restoreEnv = overrideEnv().restoreEnv;
  });

  afterEach(() => {
    restoreEnv && restoreEnv();
  });

  it('should load matching stage env file if present', async () => {
    await loadEnv('testing');
    expect(process.env).to.not.have.property('FROM_DEFAULT');
    expect(process.env.FROM_STAGE).to.equal('valuefromstage');
  });

  it('should load from default env file if present and no matching stage file found', async () => {
    await loadEnv('nonmatchingstage');
    expect(process.env.FROM_DEFAULT).to.equal('valuefromdefault');
    expect(process.env).to.not.have.property('FROM_STAGE');
  });

  it('should throw ServerlessError if dotenv returns error other than missing file', () => {
    const errorMessage = 'Unexpected error while loading env';
    const dotenvResult = sinon.stub(dotenv, 'config').returns({ error: new Error(errorMessage) });

    expect(loadEnv('testing')).to.be.rejectedWith(ServerlessError, errorMessage);
    dotenvResult.restore();
  });
});

import * as sut from '../src/Analyzer.service'; // eslint-disable-line
import { __RewireAPI__ as rw } from '../src/Analyzer.service'; // eslint-disable-line
// import { testAfterPromise } from './testHelpers';
// import { BadRequestError } from '../src/errors';

// stub out the db service
const dbStub = {
  addUser: sinon.stub(),
  addAnalyzer: sinon.stub(),
  removeAnalyzer: sinon.stub(),
  editAnalyzerName: sinon.stub(),
  addCategory: sinon.stub(),
  fetchAnalyzer: sinon.stub(),
  fetchCategory: sinon.stub(),
  fetchAnalyzerToken: sinon.stub(),
  fetchAnalyzerRecords: sinon.stub(),
  fetchAllRecordsForAnalyzer: sinon.stub(),
  fetchCategoryRecords: sinon.stub(),
  fetchAnalyzerTokens: sinon.stub(),
  saveRecord: sinon.stub(),
  saveRecords: sinon.stub(),
  fetchRecord: sinon.stub(),
  fetchRecords: sinon.stub(),
  generateNewCategoryDoc: sinon.stub(),
  getAnalyzerId: sinon.stub(),
  getCategoryId: sinon.stub(),
  getAnalyzerTokenId: sinon.stub(),
};

const tokenizerStub = sinon.stub();
const searchStub = sinon.stub();
const resetNegStub = sinon.stub();

function stubReset() {
  for (const stub in dbStub) {
    if (Object.prototype.hasOwnProperty.call(dbStub, stub)) {
      dbStub[stub].reset();
    }
    tokenizerStub.reset();
    searchStub.reset();
    resetNegStub.reset();
  }
}

describe('Analyzer.service', () => {
  beforeEach(() => {
    stubReset();
  });
  describe('.learn()', () => {

  });
  describe('.unlearn()', () => {

  });
  describe('.addToChain()', () => {

  });
  describe('.removeFromChain()', () => {

  });
  describe('.relearn()', () => {

  });
  describe('.updateTokenRecord()', () => {

  });
  describe('.categorize()', () => {

  });
  // maybe this should be a mutator
  describe('.appendRelativeProbabilities()', () => {

  });
  describe('.calculatePCategoryViaTokenCount()', () => {
    describe('when analyzerTotalTokenCount is 0', () => {
      it('should return 0', () => {
        expect(sut.calculatePCategoryViaTokenCount(0, 4)).to.equal(0);
      });
    });
    describe('when analyzerTotalTokenCount is > 0', () => {
      it('should return the correct probability', () => {
        expect(sut.calculatePCategoryViaTokenCount(20, 4)).to.equal(0.2);
      });
    });
  });
  describe('.calculatePTokenGivenCategory()', () => {
    describe('when categoryTotalTokenCount is 0', () => {
      it('should return 0', () => {
        expect(sut.calculatePTokenGivenCategory(4, 0)).to.equal(0);
      });
    });
    describe('when categoryTotalTokenCount is > 0', () => {
      it('should return the correct probability', () => {
        expect(sut.calculatePTokenGivenCategory(4, 20)).to.equal(0.2);
      });
    });
  });
  describe('.calculatePTokenGivenNotCategory()', () => {
    describe('when analyzerTotalTokenCount is 0', () => {
      it('should return 0', () => {
        expect(sut.calculatePTokenGivenNotCategory(20, 4, 0, 20)).to.equal(0);
      });
    });
    describe('when analyzerTotalTokenCount is > 0', () => {
      it('should return the correct probability', () => {
        expect(sut.calculatePTokenGivenNotCategory(20, 4, 100, 20)).to.equal(0.2);
      });
    });
  });
  describe('.calculatePToken()', () => {
    it('should return the correct probability', () => {
      expect(sut.calculatePToken(0.3, 0.5, 0.4)).to.equal(0.42);
    });
  });
  describe('.calculatePCategoryGivenToken()', () => {
    describe('when pToken is 0', () => {
      before(() => {
        const pTokenStub = sinon.stub().returns(0);
        rw.__set__({
          calculatePToken: pTokenStub,
        });
      });
      after(() => {
        rw.__ResetDependency__('calculatePToken');
      });
      it('should return 0', () => {
        expect(sut.calculatePCategoryGivenToken(4, 20, 16, 100, 0.4)).to.equal(0);
      });
    });
    describe('when pToken is > 0', () => {
      before(() => {
        rw.__set__({
          pTokenGivenCategory: sinon.stub().returns(0.2),
          pTokenGivenNotCategory: sinon.stub().returns(0.15),
          calculatePToken: sinon.stub().returns(0.17),
        });
      });
      after(() => {
        rw.__ResetDependency__('pTokenGivenCategory');
        rw.__ResetDependency__('pTokenGivenNotCategory');
        rw.__ResetDependency__('calculatePToken');
      });
      it('should return the correct probability', () => {
        // even though the interim probability functions have been stubbed, they have been stubbed to return the correct values for
        // these inputs, and this is the correct probability for these numbers.
        expect(sut.calculatePCategoryGivenToken(4, 20, 16, 100, 0.4)).to.equal((0.4705882352941177));
      });
    });
  });
  describe('.getTokenCountInCategory()', () => {
    const tokenRecord = {
      doc: {
        one: {
          count: 3,
          chain: {
            hello: 1,
            world: 2,
          },
          chainSize: 3,
        },
        two: {
          count: 2,
          chain: {
            nope: 2,
          },
          chainSize: 2,
        },
      },
    };
    it('should return the count for the token in the specified category', () => {
      expect(sut.getTokenCountInCategory(tokenRecord, 'one')).to.equal(3);
    });
    describe('when no tokenRecord is provided', () => {
      it('should return 0', () => {
        expect(sut.getTokenCountInCategory(null, 'one')).to.equal(0);
      });
    });
    describe('when the tokenRecord has an error property', () => {
      it('should return 0', () => {
        expect(sut.getTokenCountInCategory({ error: 'derp!' }, 'one')).to.equal(0);
      });
    });
    describe('when the tokenRecord does not have any information about the specified category', () => {
      it('should return 0', () => {
        expect(sut.getTokenCountInCategory(tokenRecord, 'three')).to.equal(0);
      });
    });
  });
  describe('.getTokenCountAllCategories()', () => {
    const tokenRecord = {
      doc: {
        one: {
          count: 3,
          chain: {
            hello: 1,
            world: 2,
          },
          chainSize: 3,
        },
        two: {
          count: 2,
          chain: {
            nope: 2,
          },
          chainSize: 2,
        },
      },
    };
    it('should should return the total token count for all specified categories', () => {
      expect(sut.getTokenCountAllCategories(tokenRecord, ['one', 'two'])).to.equal(5);
    });
    describe('when no tokenRecord is provided', () => {
      it('should return 0', () => {
        expect(sut.getTokenCountAllCategories(null, ['one', 'two'])).to.equal(0);
      });
    });
    describe('when the tokenRecord has an error property', () => {
      it('should return 0', () => {
        expect(sut.getTokenCountAllCategories({ error: 'derp!' }, ['one', 'two'])).to.equal(0);
      });
    });
    describe('when non-existant categories are specified', () => {
      it('should ignore them when totalling', () => {
        expect(sut.getTokenCountAllCategories(tokenRecord, ['one', 'two', 'three'])).to.equal(5);
      });
    });
  });
  describe('.calculatePCategoryGivenMarkovChain', () => {
    const prevRecord = {
      id: '1/2/$TOKEN$social',
      doc: {
        _id: '1/2/$TOKEN$social',
        one: {
          count: 4,
          chain: {
            security: 2,
            life: 2,
          },
          chainSize: 4,
        },
        two: {
          count: 10,
          chain: {
            security: 1,
            party: 4,
            engagement: 5,
          },
          chainSize: 10,
        },
        four: {
          chainSize: 0,
        },
      },
    };
    // I have gone around a few times with what constitutes the "correct" probability here...
    it('should return the correct probability', () => {
      expect(sut.calculatePCategoryGivenMarkovChain(prevRecord, 'security', 'one', 0.4)).to.equal(0.2);
    });
    describe('when a previous token record is not provided', () => {
      it('should return 0', () => {
        expect(sut.calculatePCategoryGivenMarkovChain(null, 'security', 'one', 0.4)).to.equal(0);
      });
    });
    describe('when the previous token record has an error property', () => {
      it('should return 0', () => {
        expect(sut.calculatePCategoryGivenMarkovChain({ error: 'derp!' }, 'security', 'one', 0.4)).to.equal(0);
      });
    });
    describe('when the previous token record does not have the specified category', () => {
      it('should return 0', () => {
        expect(sut.calculatePCategoryGivenMarkovChain(prevRecord, 'security', 'three', 0.4)).to.equal(0);
      });
    });
    describe('when the previous token record has a 0-length markov chain in the specified category', () => {
      it('should return 0', () => {
        expect(sut.calculatePCategoryGivenMarkovChain(prevRecord, 'security', 'four', 0.4)).to.equal(0);
      });
    });
    describe('when the previous token record\'s markov chain does not contain the current token in the specified category', () => {
      it('should return 0', () => {
        expect(sut.calculatePCategoryGivenMarkovChain(prevRecord, 'clowns', 'one', 0.4)).to.equal(0);
      });
    });
  });
  describe('.getSortedTokenIds()', () => {
    it('should return an array of sorted constructed token id strings for use with the db', () => {
      dbStub.getAnalyzerTokenId.onCall(0).returns('1/2/$TOKEN$cars');
      dbStub.getAnalyzerTokenId.onCall(1).returns('1/2/$TOKEN$apples');
      dbStub.getAnalyzerTokenId.onCall(2).returns('1/2/$TOKEN$bears');
      const result = sut.getSortedTokenIds('1', '2', ['cars', 'apples', 'bears']);
      expect(result).to.deep.equal([
        '1/2/$TOKEN$apples',
        '1/2/$TOKEN$bears',
        '1/2/$TOKEN$cars',
      ]);
    });
    describe('when the tokens supplied are non-unique', () => {
      it('should return a unique sorted array of ids', () => {
        dbStub.getAnalyzerTokenId.onCall(0).returns('1/2/$TOKEN$cars');
        dbStub.getAnalyzerTokenId.onCall(1).returns('1/2/$TOKEN$apples');
        dbStub.getAnalyzerTokenId.onCall(2).returns('1/2/$TOKEN$bears');
        dbStub.getAnalyzerTokenId.onCall(2).returns('1/2/$TOKEN$cars');
        const result = sut.getSortedTokenIds('1', '2', ['cars', 'apples', 'bears', 'cars']);
        expect(result).to.deep.equal([
          '1/2/$TOKEN$apples',
          '1/2/$TOKEN$bears',
          '1/2/$TOKEN$cars',
        ]);
      });
    });
  });
});

import * as sut from '../src/Analyzer.service'; // eslint-disable-line
import { __RewireAPI__ as rw } from '../src/Analyzer.service'; // eslint-disable-line
import { testAfterPromise } from './testHelpers';
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
const getSortedStub = sinon.stub();
const updateStub = sinon.stub();
const chainStub = sinon.stub();

function stubReset() {
  for (const stub in dbStub) {
    if (Object.prototype.hasOwnProperty.call(dbStub, stub)) {
      dbStub[stub].reset();
    }
    tokenizerStub.reset();
    searchStub.reset();
    resetNegStub.reset();
    getSortedStub.reset();
    searchStub.reset();
    updateStub.reset();
    chainStub.reset();
  }
}

describe('Analyzer.service', () => {
  beforeEach(() => {
    stubReset();
  });
  describe('.learn()', () => {
    const newCatDoc = {};
    const sorted  = ['1/1/$TOKEN$hello', '1/1/$TOKEN$there'];
    const tokens = ['hello', 'there'];
    let token1Doc;
    let token2Doc;
    let dbRecords;

    before(() => {
      rw.__set__({
        aDbService: dbStub,
        tokenizer: tokenizerStub,
        getSortedTokenIds: getSortedStub,
        binarySearchByKey: searchStub,
        updateTokenRecord: updateStub,
        addToChain: chainStub,
      });
    });
    after(() => {
      rw.__ResetDependency__('aDbService');
      rw.__ResetDependency__('tokenizer');
      rw.__ResetDependency__('getSortedTokenIds');
      rw.__ResetDependency__('binarySearchByKey');
      rw.__ResetDependency__('updateTokenRecord');
      rw.__ResetDependency__('addToChain');
    });

    beforeEach(() => {
      token1Doc = {
        id: '1/1/$TOKEN$hello',
        doc: {
          _id: '1/1/$TOKEN$hello',
          name: 'hello',
          type: 'token',
          one: {
            count: 1,
            chain: {
              any: 1,
            },
            chainSize: 1,
          },
          two: {
            count: 1,
            chain: {
              some: 2,
            },
            chainSize: 2,
          },
        },
      };
      token2Doc = {
        id: '1/1/$TOKEN$there',
        doc: {
          _id: '1/1/$TOKEN$there',
          name: 'there',
          type: 'token',
          one: {
            count: 0,
            chain: {
            },
            chainSize: 0,
          },
          two: {
            count: 0,
            chain: {
            },
            chainSize: 0,
          },
        },
      };
      dbRecords = {
        rows: [
          {
            id: '1/1',
            doc: {
              _id: '1/1',
              name: 'test analyzer',
              totalDocCount: 4,
              totalTokenCount: 20,
              type: 'analyzer',
            },
          },
          {
            id: '1/1/$CAT$one',
            doc: {
              _id: '1/1/$CAT$one',
              name: 'one',
              totalDocCount: 2,
              totalTokenCount: 8,
              type: 'category',
            },
          },
          token1Doc,
          token2Doc,
        ],
      };
      // functions to stub:
      // aDbService .getAnalyzerId .getCategoryId .fetchRecords .generateNewCategoryDoc .getAnalyzerTokenId .saveRecords
      // getSortedTokenIds
      // binarySearchByKey
      // updateTokenRecord
      // addToChain
      dbStub.getAnalyzerId.returns('1/1');
      dbStub.getCategoryId.returns('1/1/$CAT$one');
      dbStub.fetchRecords.returns(dbRecords);
      dbStub.generateNewCategoryDoc.returns(newCatDoc);
      dbStub.getAnalyzerTokenId.returns(null);

      tokenizerStub.returns(tokens);
      getSortedStub.returns(sorted);
      searchStub.onCall(0).returns(token1Doc);
      searchStub.onCall(1).returns(token2Doc);
      updateStub.returns(null);
      chainStub.returns(null);
    });
    afterEach(() => {
      stubReset();
    });
    it('should tokenize the input', (done) => {
      // console.log(tokenizerStub());
      testAfterPromise(sut.learn('1', '1', 'hello there', 'one'), () => {
        expect(tokenizerStub.calledWith('hello there')).to.equal(true);
      }, done);
    });

    it('should fetch the id for the root analyzer document', (done) => {
      testAfterPromise(sut.learn('1', '1', 'hello there', 'one'), () => {
        expect(dbStub.getAnalyzerId.calledWith('1', '1')).to.equal(true);
      }, done);
    });

    it('should fetch the id for the category document', (done) => {
      testAfterPromise(sut.learn('1', '1', 'hello there', 'one'), () => {
        expect(dbStub.getCategoryId.calledWith('1', '1', 'one')).to.equal(true);
      }, done);
    });
    it('should fetch the sorted ids for the tokens', (done) => {
      testAfterPromise(sut.learn('1', '1', 'hello there', 'one'), () => {
        expect(getSortedStub.calledWith('1', '1', ['hello', 'there'])).to.equal(true);
      }, done);
    });
    it('should use the fetched ids to retrieve all documents from the db', (done) => {
      testAfterPromise(sut.learn('1', '1', 'hello there', 'one'), () => {
        expect(dbStub.fetchRecords.calledWith(['1/1', '1/1/$CAT$one', '1/1/$TOKEN$hello', '1/1/$TOKEN$there'])).to.equal(true);
      }, done);
    });
    describe('when the category does not exist in the db', () => {
      beforeEach(() => {
        const withoutCategory = {
          rows: [
            {
              id: '1/1',
              doc: {
                _id: '1/1',
                name: 'test analyzer',
                totalDocCount: 4,
                totalTokenCount: 20,
                type: 'analyzer',
              },
            },
            {
              id: '1/1/$CAT$one',
              error: 'not found',
            },
            token1Doc,
            token2Doc,
          ],
        };
        dbStub.fetchRecords.returns(withoutCategory);
      });
      it('should generate a new category document', (done) => {
        testAfterPromise(sut.learn('1', '1', 'hello there', 'one'), () => {
          expect(dbStub.generateNewCategoryDoc.calledWith('1', '1', 'one')).to.equal(true);
        }, done);
      });
    });
    it('should increment the total document count for the analyzer', (done) => {
      testAfterPromise(sut.learn('1', '1', 'hello there', 'one'), () => {
        expect(dbStub.saveRecords.args[0][0][0].totalDocCount).to.equal(5);
      }, done);
    });
    it('should increment the total document count for the category', (done) => {
      testAfterPromise(sut.learn('1', '1', 'hello there', 'one'), () => {
        expect(dbStub.saveRecords.args[0][0][1].totalDocCount).to.equal(3);
      }, done);
    });
    it('should increase the total token count in the analyzer by the number of input tokens', (done) => {
      testAfterPromise(sut.learn('1', '1', 'hello there', 'one'), () => {
        expect(dbStub.saveRecords.args[0][0][0].totalTokenCount).to.equal(22);
      }, done);
    });
    it('should increase the total token count in the category by the number of input tokens', (done) => {
      testAfterPromise(sut.learn('1', '1', 'hello there', 'one'), () => {
        expect(dbStub.saveRecords.args[0][0][1].totalTokenCount).to.equal(10);
      }, done);
    });
    it('should call .updateTokenRecord to handle each token\'s stats', (done) => {
      testAfterPromise(sut.learn('1', '1', 'hello there', 'one'), () => {
        expect(updateStub.args[0][0].id).to.equal('1/1/$TOKEN$hello');
        expect(updateStub.args[0][1]).to.equal('one');
        expect(updateStub.args[0][2]).to.equal('increment');
        expect(updateStub.args[1][0].id).to.equal('1/1/$TOKEN$there');
        expect(updateStub.args[1][1]).to.equal('one');
        expect(updateStub.args[1][2]).to.equal('increment');
      }, done);
    });
    it('should add each token to the chain of the previous token', (done) => {
      testAfterPromise(sut.learn('1', '1', 'hello there', 'one'), () => {
        expect(chainStub.args[0][0]).to.equal('hello');
        expect(chainStub.args[0][1]).to.equal(null);
        expect(chainStub.args[0][2]).to.equal('one');
        expect(chainStub.args[1][0]).to.equal('there');
        expect(chainStub.args[1][1].id).to.equal('1/1/$TOKEN$hello');
        expect(chainStub.args[1][2]).to.equal('one');
      }, done);
    });
    it('should save all updated records to the db', (done) => {
      testAfterPromise(sut.learn('1', '1', 'hello there', 'one'), () => {
        expect(dbStub.saveRecords.args[0][0][0]._id).to.equal('1/1');
        expect(dbStub.saveRecords.args[0][0][1]._id).to.equal('1/1/$CAT$one');
        expect(dbStub.saveRecords.args[0][0][2]._id).to.equal('1/1/$TOKEN$hello');
        expect(dbStub.saveRecords.args[0][0][3]._id).to.equal('1/1/$TOKEN$there');
      }, done);
    });
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
    it('should return the correct probability', () => {
      // the current token has come after the previous token 50% of the time whenever the previous token
      // was taught to this category, which would be a HUGE marker that this sequence should probably belong to
      // this category.
      expect(sut.calculatePCategoryGivenMarkovChain(prevRecord, 'security', 'one')).to.equal(0.5);
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

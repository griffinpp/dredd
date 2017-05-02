import * as sut from '../src/Analyzer.dbService'; // eslint-disable-line
import { __RewireAPI__ as rw } from '../src/Analyzer.dbService'; // eslint-disable-line
import { testAfterPromise } from './testHelpers';
import { BadRequestError } from '../src/errors';

const dbStub = {
  get: sinon.stub(),
  put: sinon.stub(),
  bulkDocs: sinon.stub(),
  allDocs: sinon.stub(),
  query: sinon.stub(),
};

const bcryptStub = {
  hashSync: sinon.stub().returns('pnocvponew'),
};

function dbStubReset() {
  dbStub.get.reset();
  dbStub.put.reset();
  dbStub.bulkDocs.reset();
  dbStub.allDocs.reset();
  dbStub.query.reset();
}

rw.__set__({
  db: dbStub,
  bcrypt: bcryptStub,
});

describe('Analyzer.dbService', () => {
  beforeEach(() => {
    dbStubReset();
  });
  describe('.addUser()', () => {
    const userIdStub = sinon.stub().returns('1');
    const saveRecordStub = sinon.stub();

    before(() => {
      rw.__set__({
        generateUserId: userIdStub,
        saveRecord: saveRecordStub,
      });
    });
    after(() => {
      rw.__ResetDependency__('generateUserId');
      rw.__ResetDependency__('saveRecord');
    });
    it('should use .generateUserId() to generate a new id for the user', () => {
      sut.addUser('ppg', '12345');
      expect(userIdStub.calledOnce).to.equal(true);
    });
    it('should hash the user\'s password before saving', () => {
      sut.addUser('ppg', '12345');
      expect(bcryptStub.hashSync.called).to.equal(true);
    });
    it('should create and save a new user document', () => {
      sut.addUser('ppg', '12345');
      expect(saveRecordStub.args[0][0]).to.deep.equal({
        _id: '1',
        name: 'ppg',
        password: 'pnocvponew',
        type: 'user',
      });
    });
    it('should return the id of the newly created user', (done) => {
      expect(sut.addUser('ppg', '12345')).to.eventually.equal('1').notify(done);
    });
  });
  describe('.addAnalyzer()', () => {
    const analyzerIdStub = sinon.stub();
    const getIdStub = sinon.stub();
    const generateDocStub = sinon.stub();
    const saveStub = sinon.stub();
    before(() => {
      rw.__set__({
        generateAnalyzerId: analyzerIdStub,
        getAnalyzerId: getIdStub,
        generateNewCategoryDoc: generateDocStub,
        saveRecords: saveStub,
      });
    });
    beforeEach(() => {
      analyzerIdStub.reset();
      analyzerIdStub.returns('1');
      getIdStub.reset();
      getIdStub.returns('1/1');
      generateDocStub.reset();
      generateDocStub.returns({ _id: '1/1/$CAT$test', name: 'test', totalDocCount: 0, totalTokenCount: 0 });
      saveStub.reset();
    });
    after(() => {
      rw.__ResetDependency__('generateAnalyzerId');
      rw.__ResetDependency__('getAnalyzerId');
      rw.__ResetDependency__('generateNewCategoryDoc');
      rw.__ResetDependency__('saveRecords');
    });
    it('should use .generateAnalyzerId() to generate a new id for the analyzer', () => {
      sut.addAnalyzer('1', 'testAnalyzer');
      expect(analyzerIdStub.calledOnce).to.equal(true);
    });
    describe('when categories are provided', () => {
      it('should generate new documents for the categories', () => {
        sut.addAnalyzer('1', 'testAnalyzer', ['one', 'two']);
        // called once for each category
        expect(generateDocStub.args[0]).to.deep.equal(['1', '1', 'one']);
        expect(generateDocStub.args[1]).to.deep.equal(['1', '1', 'two']);
      });
    });
    it('should save all newly created documents', () => {
      sut.addAnalyzer('1', 'testAnalyzer', ['one', 'two']);
      // console.log('ARGS', saveStub.args[0]);
      expect(saveStub.args[0][0]).to.deep.equal([
        {
          _id: '1/1',
          name: 'testAnalyzer',
          totalDocCount: 0,
          totalTokenCount: 0,
          type: 'analyzer',
        },
        {
          _id: '1/1/$CAT$test',
          name: 'test',
          totalDocCount: 0,
          totalTokenCount: 0,
        },
        {
          _id: '1/1/$CAT$test',
          name: 'test',
          totalDocCount: 0,
          totalTokenCount: 0,
        },
      ]);
    });
    it('should return the new analyzer document', (done) => {
      expect(sut.addAnalyzer('1', 'testAnalyzer', ['one', 'two'])).to.eventually.deep.equal({
        _id: '1/1',
        name: 'testAnalyzer',
        totalDocCount: 0,
        totalTokenCount: 0,
        type: 'analyzer',
      }).notify(done);
    });
  });
  describe('.removeAnalyzer()', () => {
    const fetchAllStub = sinon.stub();
    const saveStub = sinon.stub();
    // setup stubs needed for this function
    before(() => {
      rw.__set__({
        fetchAllRecordsForAnalyzer: fetchAllStub,
        saveRecord: saveStub,
      });
    });
    // reset stubs after we're done testing the function so as not to interfere with other tests
    after(() => {
      rw.__ResetDependency__('fetchAllRecordsForAnalyzer');
      rw.__ResetDependency__('saveRecord');
    });
    // reset our stubs between tests of this function
    beforeEach(() => {
      fetchAllStub.reset();
      fetchAllStub.returns({
        rows: [
          {
            id: '1/2/1',
            doc: {
              _id: '1/2/1',
            },
          },
          {
            id: '1/2/2',
            doc: {
              _id: '1/2/2',
            },
          },
        ],
      });
      saveStub.reset();
    });
    it('should fetch all records related to the specified analyzer', (done) => {
      testAfterPromise(sut.removeAnalyzer(1, 2), () => {
        expect(fetchAllStub.args[0][0]).to.equal(1);
        expect(fetchAllStub.args[0][1]).to.equal(2);
      }, done);
    });
    it('should mark all fetched records deleted and save them', (done) => {
      testAfterPromise(sut.removeAnalyzer(1, 2), () => {
        expect(saveStub.calledTwice).to.equal(true);
        expect(saveStub.args[0][0]).to.deep.equal({ _id: '1/2/1', _deleted: true });
        expect(saveStub.args[1][0]).to.deep.equal({ _id: '1/2/2', _deleted: true });
      }, done);
    });
  });
  describe('.editAnalyzerName()', () => {
    const saveStub = sinon.stub();
    const getIdStub = sinon.stub();
    const fetchStub = sinon.stub();
    before(() => {
      rw.__set__({
        saveRecord: saveStub,
        getAnalyzerId: getIdStub,
        fetchRecord: fetchStub,
      });
    });
    after(() => {
      rw.__ResetDependency__('saveRecord');
      rw.__ResetDependency__('getAnalyzerId');
      rw.__ResetDependency__('fetchRecord');
    });
    beforeEach(() => {
      saveStub.reset();
      getIdStub.reset();
      getIdStub.returns('1/2');
      fetchStub.reset();
      fetchStub.returns({
        id: '1/2',
        name: 'oldName',
      });
    });
    it('should use .getAnalyzerId() to construct the correct id for the document', () => {
      sut.editAnalyzerName('1', '2', 'newName');
      expect(getIdStub.calledOnce).to.equal(true);
    });
    it('should attempt to fetch the analyzer document from the database', () => {
      sut.editAnalyzerName('1', '2', 'newName');
      expect(fetchStub.args[0][0]).to.equal('1/2');
    });
    // these tests check on functions that are called after the first await, and so must use either
    // chai-as-expected or the testAfterPromise function to make sure the full function has run before checking results
    describe('when the specified analyzer document is found in the database', () => {
      it('should update the name property of the analyzer document and save it', (done) => {
        testAfterPromise(sut.editAnalyzerName('1', '2', 'newName'), () => {
          expect(saveStub.args[0][0]).to.deep.equal({ id: '1/2', name: 'newName' });
        }, done);
      });
    });
    describe('when the specified analyzer is not found in the database', () => {
      // maybe this should be a 404 instead?
      it('should throw a BadRequestError', (done) => {
        fetchStub.returns(null);
        expect(sut.editAnalyzerName('1', '2', 'newName')).to.eventually.be.rejectedWith(BadRequestError).notify(done);
      });
    });
  });
  describe('.addCategory()', () => {
    const generateStub = sinon.stub();
    const saveStub = sinon.stub();
    before(() => {
      rw.__set__({
        generateNewCategoryDoc: generateStub,
        saveRecord: saveStub,
      });
    });
    after(() => {
      rw.__ResetDependency__('generateNewCategoryDoc');
      rw.__ResetDependency__('saveRecord');
    });
    beforeEach(() => {
      generateStub.reset();
      generateStub.returns({
        _id: '1/2/$CAT$newCat',
        name: 'newCat',
        totalDocCount: 0,
        totalTokenCount: 0,
        type: 'category',
      });
      saveStub.reset();
    });
    it('should use .generateNewCategoryDoc() to create a new category document', () => {
      sut.addCategory('1', '2', 'newCat');
      expect(generateStub.args[0]).to.deep.equal(['1', '2', 'newCat']);
    });
    it('should save the new category document', () => {
      sut.addCategory('1', '2', 'newCat');
      expect(saveStub.args[0][0]).to.deep.equal({
        _id: '1/2/$CAT$newCat',
        name: 'newCat',
        totalDocCount: 0,
        totalTokenCount: 0,
        type: 'category',
      });
    });
  });
  describe('.fetchAnalyzer()', () => {
    const getIdStub = sinon.stub();
    before(() => {
      rw.__set__({
        getAnalyzerId: getIdStub,
      });
    });
    after(() => {
      rw.__ResetDependency__('getAnalyzerId');
    });
    beforeEach(() => {
      getIdStub.reset();
      dbStub.allDocs.returns({
        rows: [
          {
            id: '1/2',
            doc: {
              _id: '1/2',
            },
          },
          {
            id: '1/2/$CAT$one',
            doc: {
              _id: '1/2/$CAT$one',
              name: 'one',
            },
          },
          {
            id: '1/2/$CAT$two',
            doc: {
              _id: '1/2/$CAT$two',
              name: 'two',
            },
          },
        ],
      });
    });
    it('should use .getAnalyzerId() to construct the analyzer id', () => {
      sut.fetchAnalyzer('1', '2');
      expect(getIdStub.args[0]).to.deep.equal(['1', '2']);
    });
    it('should fetch the analyzer document and all category documents associated with the analyzer', () => {
      getIdStub.returns('1/2');
      sut.fetchAnalyzer('1', '2');
      expect(dbStub.allDocs.args[0][0]).to.deep.equal({
        startkey: '1/2',
        endkey: '1/2/$CAT$\uffff',
        include_docs: true,
      });
    });
    it('should attach the names of all categories onto the analyzer document and return it', (done) => {
      expect(sut.fetchAnalyzer('1', '2')).to.eventually.deep.equal({
        id: '1/2',
        doc: {
          _id: '1/2',
          categories: ['one', 'two'],
        },
      }).notify(done);
    });
    describe('when the specified analyzer document is not found in the database', () => {
      it('should throw a BadRequestError', (done) => {
        dbStub.allDocs.returns({
          rows: [],
        });
        expect(sut.fetchAnalyzer('1', '2')).to.eventually.be.rejectedWith(BadRequestError).notify(done);
      });
    });
  });
  describe('.fetchCategory()', () => {
    const getIdStub = sinon.stub();
    const fetchStub = sinon.stub();
    before(() => {
      rw.__set__({
        getCategoryId: getIdStub,
        fetchRecord: fetchStub,
      });
    });
    after(() => {
      rw.__ResetDependency__('getCategoryId');
      rw.__ResetDependency__('fetchRecord');
    });
    beforeEach(() => {
      getIdStub.reset();
      getIdStub.returns('1/2/$CAT$one');
      fetchStub.reset();
    });
    it('should use .getCategoryId() to construct the category\'s id', () => {
      sut.fetchCategory('1', '2', 'one');
      expect(getIdStub.args[0]).to.deep.equal(['1', '2', 'one']);
    });
    it('should fetch the category document using the id', () => {
      sut.fetchCategory('1', '2', 'one');
      expect(fetchStub.args[0][0]).to.equal('1/2/$CAT$one');
    });
  });
  describe('.fetchAnalyzerToken()', () => {
    const getIdStub = sinon.stub();
    const fetchStub = sinon.stub();
    before(() => {
      rw.__set__({
        getAnalyzerTokenId: getIdStub,
        fetchRecord: fetchStub,
      });
    });
    after(() => {
      rw.__ResetDependency__('getAnalyzerTokenId');
      rw.__ResetDependency__('fetchRecord');
    });
    beforeEach(() => {
      getIdStub.reset();
      getIdStub.returns('1/2/$TOKEN$word');
      fetchStub.reset();
    });
    it('should use .getAnalyzerTokenId() to construct the token\'s id', () => {
      sut.fetchAnalyzerToken('1', '2', 'word');
      expect(getIdStub.args[0]).to.deep.equal(['1', '2', 'word']);
    });
    it('should fetch the category document using the id', () => {
      sut.fetchAnalyzerToken('1', '2', 'word');
      expect(fetchStub.args[0][0]).to.equal('1/2/$TOKEN$word');
    });
  });
  describe('.fetchAnalyzerRecords()', () => {
    it('should use the "analyzers" view to get all analyzers for the specified user from the database', () => {
      sut.fetchAnalyzerRecords('1');
      expect(dbStub.query.args[0][0]).to.equal('analyzers');
      expect(dbStub.query.args[0][1]).to.deep.equal({
        startkey: '1',
        endkey: '1\uffff',
        include_docs: true,
      });
    });
  });
  describe('.fetchAllRecordsForAnalyzer()', () => {
    const getIdStub = sinon.stub();
    before(() => {
      rw.__set__({
        getAnalyzerId: getIdStub,
      });
    });
    after(() => {
      rw.__ResetDependency__('getAnalyzerId');
    });
    beforeEach(() => {
      getIdStub.reset();
      getIdStub.returns('1/2');
    });
    it('should use .getAnalyzerId() to construct the startkey', () => {
      sut.fetchAllRecordsForAnalyzer('1', '2');
      expect(getIdStub.args[0]).to.deep.equal(['1', '2']);
    });
    it('should use .allDocs to fetch all documents related to the specified analyzer', () => {
      sut.fetchAllRecordsForAnalyzer('1', '2');
      expect(dbStub.allDocs.args[0][0]).to.deep.equal({
        startkey: '1/2',
        endkey: '1/2\uffff',
        include_docs: true,
      });
    });
  });
  describe('.fetchCategoryRecords()', () => {
    const getIdStub = sinon.stub();
    before(() => {
      rw.__set__({
        getAnalyzerId: getIdStub,
      });
    });
    after(() => {
      rw.__ResetDependency__('getAnalyzerId');
    });
    beforeEach(() => {
      getIdStub.reset();
      getIdStub.returns('1/2');
    });
    it('should use .getAnalyzerId() to construct the startkey', () => {
      sut.fetchCategoryRecords('1', '2');
      expect(getIdStub.args[0]).to.deep.equal(['1', '2']);
    });
    it('should use .allDocs to fetch all category documents related to the specified analyzer', () => {
      sut.fetchCategoryRecords('1', '2');
      expect(dbStub.allDocs.args[0][0]).to.deep.equal({
        startkey: '1/2/$CAT$',
        endkey: '1/2/$CAT$\uffff',
        include_docs: true,
      });
    });
  });
  describe('.fetchAnalyzerTokens()', () => {
    const getIdStub = sinon.stub();
    before(() => {
      rw.__set__({
        getAnalyzerId: getIdStub,
      });
    });
    after(() => {
      rw.__ResetDependency__('getAnalyzerId');
    });
    beforeEach(() => {
      getIdStub.reset();
      getIdStub.returns('1/2');
    });
    it('should use .getAnalyzerId() to construct the startkey', () => {
      sut.fetchAnalyzerTokens('1', '2');
      expect(getIdStub.args[0]).to.deep.equal(['1', '2']);
    });
    it('should use .allDocs to fetch all category documents related to the specified analyzer', () => {
      sut.fetchAnalyzerTokens('1', '2');
      expect(dbStub.allDocs.args[0][0]).to.deep.equal({
        startkey: '1/2/$TOKEN$',
        endkey: '1/2/$TOKEN$\uffff',
        include_docs: true,
      });
    });
  });
  describe('.saveRecord()', () => {
    it('should call the db .put function with the passed record', () => {
      sut.saveRecord({ id: 1 });
      expect(dbStub.put.args[0][0]).to.deep.equal({ id: 1 });
    });
  });
  describe('.saveRecords()', () => {
    it('should call the db .bulkDocs function with the passed records', () => {
      sut.saveRecords([
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ]);
      expect(dbStub.bulkDocs.args[0][0]).to.deep.equal([
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ]);
    });
  });
  describe('.fetchRecord()', () => {
    // the reset function above will reset the return value as well, so we have to do this for each test
    beforeEach(() => {
      dbStub.get.returns(Promise.resolve('doc'));
    });
    it('should call the db .get() function with the passed id', () => {
      sut.fetchRecord(1);
      expect(dbStub.get.args[0][0]).to.equal(1);
    });
    describe('when an error is thrown by the db .get() function', () => {
      describe('when the error is a 404 error', () => {
        it('should return null', (done) => {
          dbStub.get.returns(Promise.reject({ status: 404 }));
          expect(sut.fetchRecord(1)).to.eventually.equal(null).notify(done);
        });
      });
      describe('when the error is not a 404 error', () => {
        it('should throw the error', (done) => {
          dbStub.get.returns(Promise.reject({ status: 401 }));
          expect(sut.fetchRecord(1)).to.eventually.be.rejected.notify(done);
        });
      });
    });
    describe('when no error is thrown', () => {
      it('should return the result of the .get function', () => {
        expect(sut.fetchRecord(1)).to.eventually.equal('doc');
      });
    });
  });
  describe('.fetchRecords()', () => {
    it('should use .allDocs to fetch all requested documents', () => {
      sut.fetchRecords([1, 2, 3]);
      expect(dbStub.allDocs.args[0][0]).to.deep.equal({ keys: [1, 2, 3], include_docs: true });
    });
  });
  describe('.generateNewCategoryDoc()', () => {
    // stub out the dependency on .getCategoryId
    const stub = sinon.stub().returns('newId');
    before(() => {
      rw.__set__({
        getCategoryId: stub,
      });
    });
    after(() => {
      rw.__ResetDependency__('getCategoryId');
    });
    it('should return a valid new category document', () => {
      const userId = 'cca75a89-865a-406d-8b70-445672d5aa5d';
      const analyzerId = 'e2abbca9-0f07-48b8-b737-b615a27bdc66';
      const categoryName = 'test';
      const result = sut.generateNewCategoryDoc(userId, analyzerId, categoryName);
      expect(stub.calledOnce).to.equal(true);
      expect(result._id).to.equal('newId');
      expect(result.name).to.equal(categoryName);
      expect(result.type).to.equal('category');
      expect(result.totalDocCount).to.equal(0);
      expect(result.totalTokenCount).to.equal(0);
    });
  });
  describe('.getAnalyzerId()', () => {
    it('should return the constructed document id for the analyzer from the given inputs', () => {
      const userId = 'cca75a89-865a-406d-8b70-445672d5aa5d';
      const analyzerId = 'e2abbca9-0f07-48b8-b737-b615a27bdc66';
      const result = sut.getAnalyzerId(userId, analyzerId);
      expect(result).to.equal('cca75a89-865a-406d-8b70-445672d5aa5d/e2abbca9-0f07-48b8-b737-b615a27bdc66');
    });
  });
  describe('.getCategoryId()', () => {
    it('should return the constructed document id for the category from the given inputs', () => {
      const userId = 'cca75a89-865a-406d-8b70-445672d5aa5d';
      const analyzerId = 'e2abbca9-0f07-48b8-b737-b615a27bdc66';
      const categoryName = 'test';
      const result = sut.getCategoryId(userId, analyzerId, categoryName);
      expect(result).to.equal('cca75a89-865a-406d-8b70-445672d5aa5d/e2abbca9-0f07-48b8-b737-b615a27bdc66/$CAT$test');
    });
  });
  describe('.getAnalyzerTokenId()', () => {
    it('should return the constructed document id for the token from the given inputs', () => {
      const userId = 'cca75a89-865a-406d-8b70-445672d5aa5d';
      const analyzerId = 'e2abbca9-0f07-48b8-b737-b615a27bdc66';
      const token = 'word';
      const result = sut.getAnalyzerTokenId(userId, analyzerId, token);
      expect(result).to.equal('cca75a89-865a-406d-8b70-445672d5aa5d/e2abbca9-0f07-48b8-b737-b615a27bdc66/$TOKEN$word');
    });
  });
});


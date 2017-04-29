import * as sut from '../src/Analyzer.dbService'; // eslint-disable-line
import { __RewireAPI__ as rw } from '../src/Analyzer.dbService'; // eslint-disable-line

// const uuidRegex = /^[0-9a-z]{8}\-[0-9a-z]{4}\-4[0-9a-z]{3}\-[0-9a-z]{4}\-[0-9a-z]{12}$/; // eslint-disable-line

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
    it('should generate a new id for the user', () => {
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
    it('should generate a new id for the analyzer', () => {
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

  });
  describe('.editAnalyzerName()', () => {

  });
  describe('.addCategory()', () => {

  });
  describe('.fetchAnalyzer()', () => {

  });
  describe('.fetchCategory()', () => {

  });
  describe('.fetchAnalyzerToken()', () => {

  });
  describe('.fetchAnalyzerRecords()', () => {

  });
  describe('.fetchAllRecordsForAnalyzer()', () => {

  });
  describe('.fetchCategoryRecords()', () => {

  });
  describe('.fetchAnalyzerTokens()', () => {

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


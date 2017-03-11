import * as aService from './Analyzer.service';
// import TextAnalyzer from './TextAnalyzer';

test();

async function test() {
  try {
    const result = await aService.deleteAnalyzer('c5ea9b5d-eff5-44f2-8e5d-389e55643659');
    console.log(result);
    // const result = await aService.categorizeText('b08dedf818682d2e2e3794dfff0006c6', 'here is my social security number');
    // console.log('RESULT', result);
    // const analyzer = new TextAnalyzer();

    // analyzer.fromJSON(result.state);
    // // console.log('A', analyzer);

    // const cat = analyzer.categorize('How are you today?');

    // console.log(cat[0]);

    // analyzer.learn('Hey how are you today?', 2);
    // result.state = analyzer.toJSON();
    // await aService.saveAnalyzerRecord(result);

    // const result2 = await aService.getAnalyzerRecord('b08dedf818682d2e2e3794dfff0006c6');
    // console.log('RESULT', result2);
  } catch (err) {
    console.log('ERROR', err);
  }
}

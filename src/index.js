import * as aService from './Analyzer.service';
import * as aDbService from './Analyzer.dbService';
// import TextAnalyzer from './TextAnalyzer';

test();

async function test() {
  try {
    const userId = 'cca75a89-865a-406d-8b70-445672d5aa5d';
    const analyzerId = 'e96dd359-f3a8-4cb0-afec-ad9f076e968a';

    // const userId = await aDbService.addUser('Demo');
    // console.log(userId);

    // const analyzerId = await aDbService.addAnalyzer(userId, 'PHI', ['PHI', 'NonPHI']);
    // console.log(analyzerId);

    // await aService.learn(userId, analyzerId, 'My social security number is 1234567890', 'PHI');
    // await aService.learn(userId, analyzerId, 'Your xrays were negative.', 'PHI');
    // await aService.learn(userId, analyzerId, 'Take 3 per day.', 'PHI');
    // await aService.learn(userId, analyzerId, 'Your weight is a concern', 'PHI');
    // await aService.learn(userId, analyzerId, 'I think I might be pregnant', 'PHI');
    // await aService.learn(userId, analyzerId, 'My son is vomiting', 'PHI');
    // await aService.learn(userId, analyzerId, 'When does the cast come off?', 'PHI');
    // await aService.learn(userId, analyzerId, 'What are the side effects of my medicine? I think I may be having an allergic reaction', 'PHI');
    // await aService.learn(userId, analyzerId, 'Your next appointment is on June 10th at 10am', 'PHI');
    // await aService.learn(userId, analyzerId, 'Your eyes were extremely dilated.', 'PHI');
    // await aService.learn(userId, analyzerId, 'You have no cavities!', 'PHI');
    // await aService.learn(userId, analyzerId, 'What is this dark spot on my xray?', 'PHI');
    // await aService.learn(userId, analyzerId, 'I am allergic to tylenol, should I be worried about this medicine?', 'PHI');
    // await aService.learn(userId, analyzerId, 'My daughter is a vegan, should I be worried?', 'PHI');
    // await aService.learn(userId, analyzerId, 'The stitches won\'t stop bleeding do I need to come in?', 'PHI');
    // await aService.learn(userId, analyzerId, 'My back hurts when I walk, and I can barely bend over', 'PHI');
    // await aService.learn(userId, analyzerId, 'What did the doctor say about my colonoscopy?', 'PHI');
    // await aService.learn(userId, analyzerId, 'Your results were inconclusive, we need you to come in for more tests', 'PHI');
    // await aService.learn(userId, analyzerId, 'Your blood iron levels are normal, you probably just need to get some sleep', 'PHI');
    // await aService.learn(userId, analyzerId, 'A referral has been sent to the physical therapist', 'PHI');
    // await aService.learn(userId, analyzerId, 'My address is 123 Any street', 'PHI');
    // await aService.learn(userId, analyzerId, 'I can\'t afford to pay all at once, can we work out a payment plan?', 'PHI');
    // await aService.learn(userId, analyzerId, 'See the attached image for instructions on how to reattach the rubber band to your braces', 'PHI');
    // await aService.learn(userId, analyzerId, 'You\'ll need a root canal', 'PHI');
    // await aService.learn(userId, analyzerId, 'Everything checked out healthy!', 'PHI');
    // await aService.learn(userId, analyzerId, 'I have this awful rash, should I come in?', 'PHI');


    // // non-PHI strings
    // await aService.learn(userId, analyzerId, 'Hello, I\'d like an appointment', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'Thanks!', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'What are your office hours?', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'When is my next appointment?', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'What is the best email to reach a nurse at after hours?', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'Thank you so much!', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'Welcome to our online service', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'You should receive a response within 24 hours', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'How are you today?', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'Good to hear from you', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'You have received a message from Rhinogram', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'What\'s the nurse\'s phone number?', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'where is the office?', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'That will be fine', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'It\'s good to hear from you', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'We are open from 9am to 5pm', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'The doctor is out this week and will return on monday', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'The dentist is not currently accepting new patients', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'The weather sure is nice!', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'We have a very nice waiting room, with lots of magazines', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'An appointment generally takes about 45 minutes', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'We will be in touch', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'ok, not a problem', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'yes, that will work great', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'sound great, thanks', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'Yes, that\'s fine', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'Not a problem.  Have a great trip!', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'lol!', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'See you then!', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'I can\'t make it', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'Our lunch hour is between 1 and 2 pm', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'I sure will!', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'Perfect!', 'NonPHI');
    // await aService.learn(userId, analyzerId, 'Hey, could you come in tomorrow?', 'NonPHI');

    // const str = 'Please come in as soon as possible, your stitches need to be replaced';
    // const str = 'we have prescribed a new medicine for you';
    const str = process.argv[2] || 'Hello, how are you today?';
    const results = await aService.categorize(userId, analyzerId, str);
    console.log(`INPUT: ${str}\nPROBABLE CATEGORY: ${results.category}\nCONFIDENCE: ${results.relativeProbability}`);

    // await aService.learn(analyzerId2, 'Your stitches look fine', 'Medical');
    // await aService.learn(analyzerId2, 'Your bill comes to a total of 45 dollars', 'Finance');
    // await aService.learn(analyzerId2, 'Your next appointment is on May 4th', 'Admin');

    // await aDbService.addAnalyzer('Events', ['Admin', 'Finance', 'Medical']);
    // const results = await aDbService.fetchCategoryRecords('5779c58d-64b4-4596-b0fb-55c24f525c43');
    // console.log(results);
  } catch (err) {
    console.log('ERROR', err.stack);
  }
}

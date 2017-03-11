/* This text analyzer is not quite a naive bayes analyzer, but is still based entirely on bayes' formula.  Where
a naive bayes analyzer would normally use a smoothing function to estimate each token's probability and combine the results
together, this analyzer generates the actual probability based on existing data (which may not be the true probability) for each token,
then sums them together.  In this way, words that are not known to a category generate a 0 probability and do not contribute to
the overall sum of probabilities.  Lots of words with low probabilities may overwhelm a single word with high probability, but
in general, a category is selected for a block of text because the text has lots of high-probability words for that category.
And the more words a category learns, even if they are words known by another category, the better the analyzer gets at picking
the right category for any given block of text, even if the overall probability is not technically correct.

I wrote this partly as an exercise to learn more about the real guts of bayesian text analysis, and partly because I did not like the
results I was getting from existing libraries and wanted more fine-grained control over what was going on. - Paul Griffin */

// borrowing this simple tokenizer from the other bayes analyser for now.  Don't like that it doesn't handle apostrophes or multiple spaces correctly.
function defaultTokenizer(text) {
  //remove punctuation from text - remove anything that isn't a word char or a space
  const rgxPunctuation = /[^(a-zA-ZA-Яa-я0-9_)+\s]/g;

  const sanitized = text.replace(rgxPunctuation, ' ');

  return sanitized.split(/\s+/);
}

export default function Analyzer(options) {
  this.options = {};
  if (typeof options !== 'undefined') {
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      throw new Error('invalid options.  Pass an object');
    }
    this.options = options;
  }

  this.state = {};
  this.state.categories = {};
  this.state.totalWordCount = 0;
  this.state.categoryWordCounts = {};
  this.state.totalDocCount = 0;
  this.state.categoryDocCounts = {};
  this.state.allWordFrequencies = {};
  this.state.categoryWordFrequencies = {};
  this.tokenizer = this.options.tokenizer || defaultTokenizer;
}

/**
 * Teach the analyzer a new block of text and associate the text with a particular category. The same text can be taught
 * to multiple categories by calling learn() multiple times with the same text and different categories
 *
 * @param {string} string - The block of text to teach the analyzer
 * @param {string} category - The category that the text belongs to.  If it does not exist, it will be created
 */
Analyzer.prototype.learn = function learn(string, category) {
  this.initializeCategory(category);
  this.state.totalDocCount += 1;
  this.state.categoryDocCounts[category] += 1;
  const tokens = this.tokenizer(string);
  tokens.map((token) => {
    this.state.totalWordCount += 1;
    this.state.categoryWordCounts[category] += 1;
    if (!this.state.allWordFrequencies[token]) {
      this.state.allWordFrequencies[token] = 0;
    }
    this.state.allWordFrequencies[token] += 1;
    if (!this.state.categoryWordFrequencies[category][token]) {
      this.state.categoryWordFrequencies[category][token] = 0;
    }
    this.state.categoryWordFrequencies[category][token] += 1;
  });
};

/**
 * Unteach the analyzer a block of text, removing it from a specific category.  This funciton assumes that /string/
 * has previously been passed into the learn() function with /category/, but will do some rudimentary checking before
 * attempting to unlearn the text in /string/.  This function can be used if a block of text was previously miscategorized.
 *
 * @param {string} string - The block of text to unteach the analyzer
 * @param {string} category - the category to remove the block of text from
 */
Analyzer.prototype.unlearn = function unlearn(string, category) {
  const self = this;
  const tokens = this.tokenizer(string);
  // don't do anything if this category hasn't learned all the words in the string before
  if (!checkStringLearned()) {
    return;
  }
  this.state.totalDocCount -= 1;
  this.state.categoryDocCounts[category] -= 1;
  tokens.map((token) => {
    this.state.totalWordCount -= 1;
    this.state.categoryWordCounts[category] -= 1;
    this.state.allWordFrequencies[token] -= 1;
    this.state.categoryWordFrequencies[category][token] -= 1;
  });

  // verify that the category has learned this string before
  function checkStringLearned() {
    if (typeof self.state.categories[category] === 'undefined') {
      return false;
    }
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (typeof self.state.categoryWordFrequencies[category][token] === 'undefined' || self.state.categoryWordFrequencies[category][token] === 0) {
        return false;
      }
    }
    return true;
  }
};

/**
 * Get an array of all the categories the analyzer knows, with probability scores, in order, for /string/.  This function can be useful if you
 * want to know more information about which category was selected and why.
 *
 * @param {string} string - the block of text to analyze
 * @returns {Object[]} probabilitySums - a list of categories and their probability sums for /string/
 * @returns {string} probabilitySums[].category - the name of the category
 * @returns {float}  probabilitySums[].probabilitySum - the sum of token probabilities for category
 */
Analyzer.prototype.categories = function categories(string) {
  const tokens = this.tokenizer(string);
  const probabilitySums = [];
  Object.keys(this.state.categories).map((category) => {
    const pCategory = this.pCategory(category);
    let result1 = 0.0;
    let result2 = pCategory;
    // calculate p(category | token) for each token and sum them together.  Highest sum is the most likely category.
    tokens.map((token) => {
      let pToken = 0.0;

      pToken = this.pToken(token, category);

      // if (this.options.useSmoothing) {
      //   pToken = this.pTokenSmoothed(token, category);
      // } else {
      //   pToken = this.pToken(token, category);
      // }

      const pTokenGivenCategory = this.pTokenGivenCategory(token, category);

      // if p(token) is 0, don't let it contribute in any way to our calculations.
      // Otherwise, use bayes' theorem where p (category | token) = p (token | category) * p(category) / ((p(token | category) * p(category)) + (p(token | !category) * p(!category)))
      const pCategoryGivenToken = pToken === 0 ? 0 : (pTokenGivenCategory * pCategory) / pToken;

      result1 += pCategoryGivenToken;
      result2 += this.pTokenGivenCategoryEstimate(token, category);
    });
    // add our result to the array of results
    probabilitySums.push({
      category,
      probabilitySum: result1,
      estimateSum: result2,
    });
  });
  // sort the results by probability in descending order
  probabilitySums.sort((a, b) => {
    return b.probabilitySum - a.probabilitySum;
  });
  // return our list of probabilities
  return probabilitySums;
};

/**
 * Analyze a block of text and return the category or categories that it should belong to.  /range/ is an experimental parameter that
 * allows you to specify a distance from the most likely category's score such that any other categories whose score is within /range/
 * of the highest score will also be returned.
 * For example, given three categories, Scheduling, Medical, and Billing, suppose the analyzer gave a block of text the following scores:
 *
 * Scheduling - 4.4163
 * Billing - 3.9976
 * Medical - 1.0032
 *
 * A /range/ of 0.5 would cause this function to return both Scheduling and Billing as categories for the text, whereas a /range/
 * of 0.25 would cause the function to only return Scheduling.  I am not sure yet what a reasonable value for /range/ could be in order
 * to consistently return "close" categories when the possibility of multiple categories is desired.
 *
 * A /range/ of 0 is used by default, so that only the highest scoring category is returned.
 *
 * @param {string} string - the block of text to categorize
 * @param {float} [range = 0.0] - how close to the maximum score a category's score must be to be included in the results
 * @returns {string[]} - the list of categories that /string/ belongs to
 */
Analyzer.prototype.categorize = function categorize(string, range) {
  let diameter = 0;
  if (typeof range !== 'undefined') {
    diameter = range;
  }

  const categories = [];
  const probabilities = this.categories(string);
  const maxProbabilitySum = probabilities[0].probabilitySum;
  categories.push(probabilities[0].category);
  probabilities.map((obj) => {
    if (obj.category !== categories[0] && (maxProbabilitySum - obj.probabilitySum) < diameter) {
      categories.push(obj.category);
    }
  });
  // return all categories within /range/ of the most likely category
  return categories;
};

/**
 * Serialize the analyzer's state for storage
 *
 * @returns {string} - a JSON string of the analyzer's state
 */
Analyzer.prototype.toJSON = function toJSON() {
  return JSON.stringify(this.state);
};

/**
 * Deserialize an analyzer's state from a string that was generated by the toJSON function.
 *
 * @param {string} jsonStr - the string of JSON describing the analyzer's state when it was serialized
 */
Analyzer.prototype.fromJSON = function fromJSON(jsonStr) {
  const state = JSON.parse(jsonStr);
  const self = this;

  Object.keys(this.state).map((key) => {
    if (Object.prototype.hasOwnProperty.call(self.state, key)) {
      if (state[key] === undefined || state[key] === null) {
        throw new Error(`json did not have ${key}`);
      }
      self.state[key] = state[key];
    }
  });
};

/**
 * Print the analyzer's state to the console for debugging purposes.
 */
Analyzer.prototype.debug = function debug() {
  // eslint-disable-next-line
  console.log(JSON.stringify(this.state, null, 2));
};

// --== BEGIN INTERNAL FUNCITONS ==--

// these functions are used internally by the analyzer, but are exposed for testing purposes

// use the exact numbers to calculate the p.  This will return 0 for words that have not been learned.
Analyzer.prototype.pToken = function pToken(token, category) {
  const categoryP = this.pCategory(category);
  const tokenGivenCategoryP = this.pTokenGivenCategory(token, category);
  const getTokenGivenNotCategoryP = this.pTokenGivenNotCategory(token, category);
  // p (token | category) * p (category) + p(token | !category) * p(!category)
  return (tokenGivenCategoryP * categoryP) + (getTokenGivenNotCategoryP * (1 - categoryP));
};

// use Laplace smoothing to estimate the p. This will return very small values for words that have not been learned, but will never return 0.
Analyzer.prototype.pTokenGivenCategoryEstimate = function pTokenGivenCategoryEstimate(token, category) {
  const categoryTokenCount = this.state.categoryWordCounts[category];
  const totalTokenCount = this.state.totalWordCount;
  const categoryTokenFrequency = this.state.categoryWordFrequencies[category][token] || 0;

  return (categoryTokenFrequency + 1) / (categoryTokenCount + totalTokenCount);
};

Analyzer.prototype.pCategory = function pCategory(category) {
  return this.state.categoryDocCounts[category] / this.state.totalDocCount;
};

Analyzer.prototype.pTokenGivenCategory = function pTokenGivenCategory(token, category) {
  const categoryTokenFrequency = this.state.categoryWordFrequencies[category][token] || 0;
  const categoryTokenCount = this.state.categoryWordCounts[category];
  return categoryTokenFrequency / categoryTokenCount;
};

Analyzer.prototype.pTokenGivenNotCategory = function pTokenGivenNotCategory(token, category) {
  const tokenFrequency = this.state.allWordFrequencies[token] || 0;
  const categoryTokenFrequency = this.state.categoryWordFrequencies[category][token] || 0;
  const categoryTokenCount = this.state.categoryWordCounts[category];
  const totalTokenCount = this.state.totalWordCount;

  return (tokenFrequency - categoryTokenFrequency) / (totalTokenCount - categoryTokenCount);
};

Analyzer.prototype.initializeCategory = function initializeCategory(name) {
  if (!this.state.categories[name]) {
    this.state.categories[name] = true;
    this.state.categoryWordCounts[name] = 0;
    this.state.categoryDocCounts[name] = 0;
    this.state.categoryWordFrequencies[name] = {};
  }
};

// --== END INTERNAL FUNCITONS ==--

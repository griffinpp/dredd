// borrowing this simple tokenizer from the other bayes analyser for now.  Don't like that it doesn't handle apostrophes or multiple spaces correctly.
export default function defaultTokenizer(text) {
  //remove punctuation from text - remove anything that isn't a word char or a space
  const rgxPunctuation = /[^(a-zA-ZA-Яa-я0-9_)+\s]/g;

  const sanitized = text.replace(rgxPunctuation, ' ');

  return sanitized.split(/\s+/);
}

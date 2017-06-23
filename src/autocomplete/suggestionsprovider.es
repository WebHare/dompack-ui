export default class SuggestionsProviderBase
{
  resolve()
  {
    throw new Error("Derived class must override 'resolve()' to return a promise");
  }
}

class ResolvedSuggestions extends SuggestionsProviderBase
{
  constructor(results)
  {
    super();
    this.results = results.map(result => typeof(result) == "string" ? { text: result } : result);
  }
  resolve()
  {
    return Promise.resolve(this.results);
  }
}

SuggestionsProviderBase.wrap = function(towrap)
{
  if(!towrap)
    return null; //lookup failed
  if(Array.isArray(towrap))
    return new ResolvedSuggestions(towrap);
}

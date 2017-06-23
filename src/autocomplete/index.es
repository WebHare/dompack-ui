import * as dompack from "dompack";
import './styling.scss';
import SuggestionsProviderBase from './suggestionsprovider';

/* FIXME enzo

- catalog instellen moet extern, iets als

new cSearchSuggest(node, suggestionsprovider, options);
    waarbij suggestionsprovider een callback is waar we van verwachten
    - een array (deze interpreteren we direct als tekst suggesties, maar wrappen we als SuggestionsProvider)
    - een promise (het meest simpele geval en deze wrappen we als SuggestionsProvider)
    - een dompack.SuggestionsProvider
)
*/

//FIXME ----------------- move to dompack/api ------------

//FIXME ^^^^ end of dompack/api

/*
  cSearchSuggest
    suggest container is inserted in end of search form
  options: catalog: string , consilio catalog name
           rpc: boolean    , switch when option is selected then plain submit or just fire submit event for rpc
*/
export default class cSearchSuggest
{
  constructor( inputnode, searchprovider, options )
  {
    this.options = { minlength:3, ...options};
    this.inputnode = inputnode;
    this.searchprovider = searchprovider;

/*
    this.options = JSON.parse(inputnode.getAttribute("data-suggest"));

    if( !this.options.catalog )
    {
      console.warn("No catalog set");
      return;
    }
*/
    this.formnode = dompack.closest(this.inputnode, "form");

    this.history = [];

    document.body.addEventListener("click", ev =>
    {
      if( !this.suggestwrapper )
        return;

      let chknode = dompack.closest(ev.target, "form");
      if( !chknode || chknode != this.formnode )
        this.removeSuggestions();
    });

    this.words = this.inputnode.value;
    this.inputnode.addEventListener("keyup", ev =>
    {
      if( this.suggestwrapper && ev.keyCode == 40 )
      { //down 40, up 38
        ev.preventDefault();
        this.suggestwrapper.querySelector("li").focus();
      }

      if( this.updatetimer )
        clearTimeout(this.updatetimer);

      let inpval = this.inputnode.value;
      if( inpval.trim )
        inpval = inpval.trim();

      if( inpval != this.words )
        this.updatetimer = setTimeout( ev => this.updateList( inpval ), 200);
    });

    this.inputnode.addEventListener("search", ev => this.removeSuggestions() );//case search clear field
  }

  async updateList( words )
  {
    this.words = words;

    //first check if we have already suggestions for given input
    for( let i = this.history.length - 1; i >= 0 && this.words.length >= this.options.minlength; --i)
    {
      if( this.history[i].words == this.words )
      {
        this.updateSuggestions(this.history[i].values);
        return;
      }
    }

    if( this.words != "" && this.words.length >= this.options.minlength )
    {
      if(dompack.debugflags.uas)
        console.log(`[uas] starting lookup for '${this.words}'`);

      //FIXME cancel any current search
      //FIXME add a delay before searching. try to throttle if user's are being annoying/excessive or if the requets is uncancellabel ?
      this.searcher = SuggestionsProviderBase.wrap(this.searchprovider(this.words));


/*      if(this.suggestionrpc)
        consiliosearch.rpcResolve(this.suggestionrpc, null);

      this.suggestionrpc = consiliosearch.suggest(
        { type: "catalog"
        , catalog: this.options.catalog
        }
        , this.words
        , { doccount: ""
          , count: 10
          });
*/
      let results = await this.searcher.resolve();
      if(results)
        this.updateSuggestions(results.values);
    }
    else if( this.suggestwrapper )
      this.removeSuggestions();
  }

  updateSuggestions( suggestions )
  {
    if( suggestions.length == 0 )
    {
      this.removeSuggestions();
      return;
    }

    //this.formnode.classList.add("suggestionsactive");

    this.history.push({"words" : this.words, "values" : suggestions });
    if( this.history.length > 100 ) //limit nr items in history
      this.history.shift();

    if( !this.suggestwrapper )
    {
      this.listitems = [];
      this.suggestwrapper = dompack.create("ul",{ "className" : "wh-autocomplete-values"} );

      this.formnode.appendChild(this.suggestwrapper);

      this.suggestwrapper.addEventListener("keydown", ev =>
      {
        if( ev.keyCode == 38 )
        { // Up
          ev.preventDefault();

          let focusednode = this.inputnode;
          for(let i = this.listitems.length - 1; i >= 0; --i)
          {
            if( document.activeElement == this.listitems[i] )
            {
              if( i > 0 )
                focusednode = this.listitems[i - 1];
              break;
            }
          }
          focusednode.focus();
        }
        else if( ev.keyCode == 40 )
        {// Down
          ev.preventDefault();

          let focusednode = this.inputnode;
          for(let i = 0; i < this.listitems.length; ++i)
          {
            if( document.activeElement == this.listitems[i] )
            {
              if(i < this.listitems.length - 1)
                focusednode = this.listitems[i + 1];
              break;
            }
          }
          focusednode.focus();
        }
        else if( ev.keyCode == 27 ) // Esc
        {
          this.inputnode.focus();
          this.removeSuggestions();
        }
        else if( ev.keyCode == 13 ) // Enter
        {
          let item = dompack.closest( ev.target, "li");
          if( item )
          {
            this.inputnode.value = item.getAttribute("data-value");
            this.removeSuggestions();//remove list

            if( this.options.rpc ) // trigger Rpc
              dompack.dispatchCustomEvent(this.formnode, "submit", { bubbles: false, cancelable: true});
            else
              this.formnode.submit();//basic submit
          }
        }
      });
    }

    this.suggestwrapper.innerHTML = "";//first empty container
    for( let item of suggestions )
    {
      let line = item.value.replace(this.words, "<span class=\"match\">" + this.words + "</span>")

      let node = dompack.create("li", { "innerHTML" : line } );
      node.setAttribute("tabindex", "0");
      node.setAttribute("data-value", item.value);

      node.addEventListener("click", ev => {
        this.inputnode.value = item.value;
        this.removeSuggestions();//hide/remove list

        if( this.options.rpc ) // trigger Rpc
          dompack.dispatchCustomEvent(this.formnode, "submit", { bubbles: false, cancelable: true})
        else
          this.formnode.submit();//basic submit
      });

      this.listitems.push(node);

      this.suggestwrapper.appendChild(node);
    }
  }

  removeSuggestions()
  {
    //this.formnode.classList.remove("suggestionsactive");

    if( !this.suggestwrapper )
      return;
    this.suggestwrapper.parentNode.removeChild( this.suggestwrapper );
    this.suggestwrapper = null;
  }
}


//dompack.register("input[data-suggest]", node => new cSearchSuggest( node ) );


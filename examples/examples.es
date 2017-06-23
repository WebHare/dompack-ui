import * as dompack from 'dompack';
import dompackAutoComplete from '../src/autocomplete';

function simpleSuggestProvider(value)
{
  return value=='a' ? ['aap',{text:'noot'},{text:'mies'}] : null;
}

dompack.onDomReady(function()
{
  new dompackAutoComplete(dompack.qS('#suggest-simple'), simpleSuggestProvider, {minlength:1});
});

dompack.initDebug();

import * as test from "dompack/testframework";
import * as StackTraceJS from "stacktrace-js";

test.initStacktraceJS(StackTraceJS);
test.addTests(
[ "Autocomplete test"
, async function()
  {
    await test.loadPage('../examples/index.html');
    test.qS('#suggest-simple').focus();
    test.pressKey('a');
  }
]);

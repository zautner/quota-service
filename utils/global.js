Object.defineProperty(global, "__stack", {
  get: () => {
    const orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function (_, stack) {
      return stack.map((value) => {
        return ({
          ...value,
          typename: value.getTypeName(),
          functionname: value.getFunctionName(),
          filename: value.getFileName(),
          linenumber: value.getLineNumber()
        });
      });
    };
    const err = new Error();
    Error.captureStackTrace(err);
    const stack = err.stack;
    Error.prepareStackTrace = orig;
    return stack;
  }
});

Object.defineProperty(global, "__line", {
  // eslint-disable-next-line no-undef
  get: () => __stack[1].linenumber
});

Object.defineProperty(global, "__status", {
  // eslint-disable-next-line no-undef
  get: () => `${__filename} ":" ${__stack[1].linenumber} "(" ${__stack[1].functionname} ")"}`
});

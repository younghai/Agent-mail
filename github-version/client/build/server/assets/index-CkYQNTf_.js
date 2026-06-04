import { v as addHandler$1, x as maybeInstrument, G as GLOBAL_OBJ, y as triggerHandlers$1, z as getActiveSpan, A as getRootSpan, D as DEBUG_BUILD$5, B as debug$2, C as SPAN_STATUS_ERROR, E as getClient, H as hasSpansEnabled, I as SentryNonRecordingSpan, J as getDynamicSamplingContextFromSpan, K as freezeDscOnSpan, P as getCurrentScope, Q as timestampInSeconds, T as spanTimeInputToSeconds, U as getSpanDescendants, V as spanToJSON, W as shouldIgnoreSpan, _ as _setSpanForScope, X as SEMANTIC_ATTRIBUTE_SENTRY_IDLE_SPAN_FINISH_REASON, Y as SPAN_STATUS_OK, Z as removeChildSpanFromSpan, $ as SentrySpan, a0 as startInactiveSpan, a1 as envelopeContainsItemType, a2 as parseRetryAfterHeader, a3 as safeUnref, a4 as dsnFromString, a5 as getEnvelopeEndpointWithUrlEncodedAuth, a6 as createEnvelope, a7 as forEachEnvelopeItem, a8 as parseCookie, a9 as filterKeyValueData, aa as SENSITIVE_COOKIE_NAME_SNIPPETS, ab as FILTERED_VALUE, ac as defineIntegration, ad as CONSOLE_LEVELS$1, ae as addConsoleInstrumentationHandler, af as withScope, ag as addExceptionMechanism, ah as safeJoin, ai as captureException, aj as severityLevelFromString, ak as isError, al as normalize, am as isPlainObject, an as setSkipNormalizationHint, ao as truncate, ap as relative, aq as basename, ar as startSpan, as as SEMANTIC_ATTRIBUTE_SENTRY_OP, at as SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN, au as setHttpStatus, av as addBreadcrumb, aw as getFramesFromEvent, ax as fill, ay as _INTERNAL_captureLog, az as isPrimitive, aA as _INTERNAL_captureMetric, aB as hasSpanStreamingEnabled, aC as isThenable, aD as startSpanManual, aE as handleCallbackErrors, aF as isBrowser, aG as addIntegration, aH as getIsolationScope, aI as getGlobalScope, aJ as getOriginalFunction, aK as markFunctionWrapped, aL as addNonEnumerableProperty, aM as addExceptionTypeValue, aN as SDK_VERSION, aO as resolvedSyncPromise, aP as isErrorEvent$2, aQ as isDOMError, aR as isDOMException, aS as isEvent, aT as isParameterizedString, aU as _enhanceErrorWithSentryInfo, aV as normalizeToSize, aW as extractExceptionKeysForMessage, aX as Client, aY as applySdkMetadata, aZ as _INTERNAL_flushLogsBuffer, a_ as _INTERNAL_flushMetricsBuffer, a$ as getSDKSource, b0 as getFunctionName, b1 as isString, b2 as withActiveSpan, b3 as browserPerformanceTimeOrigin, b4 as SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_VALUE, b5 as SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_UNIT, b6 as SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME, b7 as setMeasurement, b8 as parseUrl, b9 as stringMatchesSomePattern, ba as spanToStreamedSpanJSON, bb as uuid4, bc as supportsHistory, bd as isNativeFunction, be as createTransport, bf as makePromiseBuffer, bg as UNKNOWN_FUNCTION, bh as createStackParser, bi as dsnToString, bj as addFetchInstrumentationHandler, bk as getEventDescription, bl as getBreadcrumbLogLevelFromHttpStatusCode, bm as startSession, bn as captureSession, bo as safeSetSpanJSONAttributes, bp as captureEvent, bq as stripDataUrlContent, br as applyAggregateErrorsToEvent, bs as consoleSandbox, bt as inboundFiltersIntegration, bu as functionToStringIntegration, bv as conversationIdIntegration, bw as dedupeIntegration, bx as getIntegrationsToSetup, by as stackParserFromStackParserOptions, bz as setNormalizeStringifier, bA as initAndBind, bB as lastEventId, bC as getReportDialogEndpoint, bD as supportsReportingObserver, bE as captureMessage, bF as supportsNativeFetch, bG as isSentryRequestUrl, bH as stripUrlQueryAndFragment, bI as addContextToFrame, bJ as SEMANTIC_ATTRIBUTE_URL_FULL, bK as SEMANTIC_ATTRIBUTE_HTTP_REQUEST_METHOD, bL as parseSampleRate, bM as SEMANTIC_ATTRIBUTE_SENTRY_SOURCE, bN as addEventProcessor, bO as setContext, bP as updateRateLimits, bQ as isRateLimited, bR as prepareEvent, bS as createEventEnvelopeHeaders, bT as getSdkMetadataForEnvelopeHeader, bU as instrumentFetchRequest, bV as getTraceData, bW as addFetchEndInstrumentationHandler, bX as parseStringToURLObject, bY as getSanitizedUrlStringFromUrlObject, bZ as SEMANTIC_ATTRIBUTE_SENTRY_PREVIOUS_TRACE_SAMPLE_RATE, b_ as SEMANTIC_LINK_ATTRIBUTE_LINK_TYPE, b$ as SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE, c0 as generateSpanId, c1 as generateTraceId, c2 as propagationContextFromHeaders, c3 as dateTimestampInSeconds, c4 as spanIsSampled, c5 as isStreamedBeforeSendSpanCallback, c6 as SpanBuffer, c7 as captureSpan, c8 as parseEnvelope, c9 as serializeEnvelope, ca as DEFAULT_ENVIRONMENT, cb as getDebugImagesForResources, cc as suppressTracing, a as reactExports, cd as setNormalizationDepthOverrideHint } from "./worker-entry-DT1UyHjv.js";
import { ce, cf, cg, ch, ci, cj, ck, cl, cm, cn, co, cp, cq, cr, cs, ct, cu, cv, cw, cx, cy, cz } from "./worker-entry-DT1UyHjv.js";
import "node:events";
import "node:async_hooks";
import "cloudflare:workers";
import "node:diagnostics_channel";
let _oldOnErrorHandler = null;
function addGlobalErrorInstrumentationHandler(handler) {
  const type = "error";
  addHandler$1(type, handler);
  maybeInstrument(type, instrumentError);
}
function instrumentError() {
  _oldOnErrorHandler = GLOBAL_OBJ.onerror;
  GLOBAL_OBJ.onerror = function(msg, url, line, column, error2) {
    const handlerData = {
      column,
      error: error2,
      line,
      msg,
      url
    };
    triggerHandlers$1("error", handlerData);
    if (_oldOnErrorHandler) {
      return _oldOnErrorHandler.apply(this, arguments);
    }
    return false;
  };
  GLOBAL_OBJ.onerror.__SENTRY_INSTRUMENTED__ = true;
}
let _oldOnUnhandledRejectionHandler = null;
function addGlobalUnhandledRejectionInstrumentationHandler(handler) {
  const type = "unhandledrejection";
  addHandler$1(type, handler);
  maybeInstrument(type, instrumentUnhandledRejection);
}
function instrumentUnhandledRejection() {
  _oldOnUnhandledRejectionHandler = GLOBAL_OBJ.onunhandledrejection;
  GLOBAL_OBJ.onunhandledrejection = function(e2) {
    const handlerData = e2;
    triggerHandlers$1("unhandledrejection", handlerData);
    if (_oldOnUnhandledRejectionHandler) {
      return _oldOnUnhandledRejectionHandler.apply(this, arguments);
    }
    return true;
  };
  GLOBAL_OBJ.onunhandledrejection.__SENTRY_INSTRUMENTED__ = true;
}
let errorsInstrumented = false;
function registerSpanErrorInstrumentation() {
  if (errorsInstrumented) {
    return;
  }
  function errorCallback() {
    const activeSpan = getActiveSpan();
    const rootSpan = activeSpan && getRootSpan(activeSpan);
    if (rootSpan) {
      const message = "internal_error";
      DEBUG_BUILD$5 && debug$2.log(`[Tracing] Root span: ${message} -> Global error occurred`);
      rootSpan.setStatus({ code: SPAN_STATUS_ERROR, message });
    }
  }
  errorsInstrumented = true;
  addGlobalErrorInstrumentationHandler(errorCallback);
  addGlobalUnhandledRejectionInstrumentationHandler(errorCallback);
}
const TRACING_DEFAULTS = {
  idleTimeout: 1e3,
  finalTimeout: 3e4,
  childSpanTimeout: 15e3
};
const FINISH_REASON_HEARTBEAT_FAILED = "heartbeatFailed";
const FINISH_REASON_IDLE_TIMEOUT = "idleTimeout";
const FINISH_REASON_FINAL_TIMEOUT = "finalTimeout";
const FINISH_REASON_EXTERNAL_FINISH = "externalFinish";
function startIdleSpan(startSpanOptions, options = {}) {
  const activities = /* @__PURE__ */ new Map();
  let _finished = false;
  let _idleTimeoutID;
  let _finishReason = FINISH_REASON_EXTERNAL_FINISH;
  let _autoFinishAllowed = !options.disableAutoFinish;
  const _cleanupHooks = [];
  const {
    idleTimeout = TRACING_DEFAULTS.idleTimeout,
    finalTimeout = TRACING_DEFAULTS.finalTimeout,
    childSpanTimeout = TRACING_DEFAULTS.childSpanTimeout,
    beforeSpanEnd,
    trimIdleSpanEndTimestamp = true
  } = options;
  const client = getClient();
  if (!client || !hasSpansEnabled()) {
    const span2 = new SentryNonRecordingSpan();
    const dsc = {
      sample_rate: "0",
      sampled: "false",
      ...getDynamicSamplingContextFromSpan(span2)
    };
    freezeDscOnSpan(span2, dsc);
    return span2;
  }
  const scope = getCurrentScope();
  const previousActiveSpan = getActiveSpan();
  const span = _startIdleSpan(startSpanOptions);
  span.end = new Proxy(span.end, {
    apply(target, thisArg, args) {
      if (beforeSpanEnd) {
        beforeSpanEnd(span);
      }
      if (thisArg instanceof SentryNonRecordingSpan) {
        return;
      }
      const [definedEndTimestamp, ...rest] = args;
      const timestamp = definedEndTimestamp || timestampInSeconds();
      const spanEndTimestamp = spanTimeInputToSeconds(timestamp);
      const spans = getSpanDescendants(span).filter((child) => child !== span);
      const spanJson = spanToJSON(span);
      if (!spans.length || !trimIdleSpanEndTimestamp) {
        onIdleSpanEnded(spanEndTimestamp);
        return Reflect.apply(target, thisArg, [spanEndTimestamp, ...rest]);
      }
      const ignoreSpans = client.getOptions().ignoreSpans;
      const latestSpanEndTimestamp = spans?.reduce((acc, current) => {
        const currentSpanJson = spanToJSON(current);
        if (!currentSpanJson.timestamp) {
          return acc;
        }
        if (ignoreSpans && shouldIgnoreSpan(
          { description: currentSpanJson.description, op: currentSpanJson.op, attributes: currentSpanJson.data },
          ignoreSpans
        )) {
          return acc;
        }
        return acc ? Math.max(acc, currentSpanJson.timestamp) : currentSpanJson.timestamp;
      }, void 0);
      const spanStartTimestamp = spanJson.start_timestamp;
      const endTimestamp = Math.min(
        spanStartTimestamp ? spanStartTimestamp + finalTimeout / 1e3 : Infinity,
        Math.max(spanStartTimestamp || -Infinity, Math.min(spanEndTimestamp, latestSpanEndTimestamp || Infinity))
      );
      onIdleSpanEnded(endTimestamp);
      return Reflect.apply(target, thisArg, [endTimestamp, ...rest]);
    }
  });
  function _cancelIdleTimeout() {
    if (_idleTimeoutID) {
      clearTimeout(_idleTimeoutID);
      _idleTimeoutID = void 0;
    }
  }
  function _restartIdleTimeout(endTimestamp) {
    _cancelIdleTimeout();
    _idleTimeoutID = setTimeout(() => {
      if (!_finished && activities.size === 0 && _autoFinishAllowed) {
        _finishReason = FINISH_REASON_IDLE_TIMEOUT;
        span.end(endTimestamp);
      }
    }, idleTimeout);
  }
  function _restartChildSpanTimeout(endTimestamp) {
    _idleTimeoutID = setTimeout(() => {
      if (!_finished && _autoFinishAllowed) {
        _finishReason = FINISH_REASON_HEARTBEAT_FAILED;
        span.end(endTimestamp);
      }
    }, childSpanTimeout);
  }
  function _pushActivity(spanId) {
    _cancelIdleTimeout();
    activities.set(spanId, true);
    const endTimestamp = timestampInSeconds();
    _restartChildSpanTimeout(endTimestamp + childSpanTimeout / 1e3);
  }
  function _popActivity(spanId) {
    if (activities.has(spanId)) {
      activities.delete(spanId);
    }
    if (activities.size === 0) {
      const endTimestamp = timestampInSeconds();
      _restartIdleTimeout(endTimestamp + idleTimeout / 1e3);
    }
  }
  function onIdleSpanEnded(endTimestamp) {
    _finished = true;
    activities.clear();
    _cleanupHooks.forEach((cleanup) => cleanup());
    _setSpanForScope(scope, previousActiveSpan);
    const spanJSON = spanToJSON(span);
    const { start_timestamp: startTimestamp } = spanJSON;
    if (!startTimestamp) {
      return;
    }
    const attributes = spanJSON.data;
    if (!attributes[SEMANTIC_ATTRIBUTE_SENTRY_IDLE_SPAN_FINISH_REASON]) {
      span.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_IDLE_SPAN_FINISH_REASON, _finishReason);
    }
    const currentStatus = spanJSON.status;
    if (!currentStatus || currentStatus === "unknown") {
      span.setStatus({ code: SPAN_STATUS_OK });
    }
    debug$2.log(`[Tracing] Idle span "${spanJSON.op}" finished`);
    const childSpans = getSpanDescendants(span).filter((child) => child !== span);
    let discardedSpans = 0;
    childSpans.forEach((childSpan) => {
      if (childSpan.isRecording()) {
        childSpan.setStatus({ code: SPAN_STATUS_ERROR, message: "cancelled" });
        childSpan.end(endTimestamp);
        DEBUG_BUILD$5 && debug$2.log("[Tracing] Cancelling span since span ended early", JSON.stringify(childSpan, void 0, 2));
      }
      const childSpanJSON = spanToJSON(childSpan);
      const { timestamp: childEndTimestamp = 0, start_timestamp: childStartTimestamp = 0 } = childSpanJSON;
      const spanStartedBeforeIdleSpanEnd = childStartTimestamp <= endTimestamp;
      const timeoutWithMarginOfError = (finalTimeout + idleTimeout) / 1e3;
      const spanEndedBeforeFinalTimeout = childEndTimestamp - childStartTimestamp <= timeoutWithMarginOfError;
      if (DEBUG_BUILD$5) {
        const stringifiedSpan = JSON.stringify(childSpan, void 0, 2);
        if (!spanStartedBeforeIdleSpanEnd) {
          debug$2.log("[Tracing] Discarding span since it happened after idle span was finished", stringifiedSpan);
        } else if (!spanEndedBeforeFinalTimeout) {
          debug$2.log("[Tracing] Discarding span since it finished after idle span final timeout", stringifiedSpan);
        }
      }
      if (!spanEndedBeforeFinalTimeout || !spanStartedBeforeIdleSpanEnd) {
        removeChildSpanFromSpan(span, childSpan);
        discardedSpans++;
      }
    });
    if (discardedSpans > 0) {
      span.setAttribute("sentry.idle_span_discarded_spans", discardedSpans);
    }
  }
  _cleanupHooks.push(
    client.on("spanStart", (startedSpan) => {
      if (_finished || startedSpan === span || !!spanToJSON(startedSpan).timestamp || startedSpan instanceof SentrySpan && startedSpan.isStandaloneSpan()) {
        return;
      }
      const allSpans = getSpanDescendants(span);
      if (allSpans.includes(startedSpan)) {
        _pushActivity(startedSpan.spanContext().spanId);
      }
    })
  );
  _cleanupHooks.push(
    client.on("spanEnd", (endedSpan) => {
      if (_finished) {
        return;
      }
      _popActivity(endedSpan.spanContext().spanId);
    })
  );
  _cleanupHooks.push(
    client.on("idleSpanEnableAutoFinish", (spanToAllowAutoFinish) => {
      if (spanToAllowAutoFinish === span) {
        _autoFinishAllowed = true;
        _restartIdleTimeout();
        if (activities.size) {
          _restartChildSpanTimeout();
        }
      }
    })
  );
  if (!options.disableAutoFinish) {
    _restartIdleTimeout();
  }
  setTimeout(() => {
    if (!_finished) {
      span.setStatus({ code: SPAN_STATUS_ERROR, message: "deadline_exceeded" });
      _finishReason = FINISH_REASON_FINAL_TIMEOUT;
      span.end();
    }
  }, finalTimeout);
  return span;
}
function _startIdleSpan(options) {
  const span = startInactiveSpan(options);
  _setSpanForScope(getCurrentScope(), span);
  DEBUG_BUILD$5 && debug$2.log("[Tracing] Started span is an idle span");
  return span;
}
const MIN_DELAY = 100;
const START_DELAY = 5e3;
const MAX_DELAY = 36e5;
function makeOfflineTransport(createTransport2) {
  function log(...args) {
    DEBUG_BUILD$5 && debug$2.log("[Offline]:", ...args);
  }
  return (options) => {
    const transport = createTransport2(options);
    if (!options.createStore) {
      throw new Error("No `createStore` function was provided");
    }
    const store = options.createStore(options);
    let retryDelay = START_DELAY;
    let flushTimer;
    function shouldQueue(env, error2, retryDelay2) {
      if (envelopeContainsItemType(env, ["client_report"])) {
        return false;
      }
      if (options.shouldStore) {
        return options.shouldStore(env, error2, retryDelay2);
      }
      return true;
    }
    function flushIn(delay) {
      if (flushTimer) {
        clearTimeout(flushTimer);
      }
      flushTimer = safeUnref(
        setTimeout(async () => {
          flushTimer = void 0;
          const found = await store.shift();
          if (found) {
            log("Attempting to send previously queued event");
            found[0].sent_at = (/* @__PURE__ */ new Date()).toISOString();
            void send(found, true).catch((e2) => {
              log("Failed to retry sending", e2);
            });
          }
        }, delay)
      );
    }
    function flushWithBackOff() {
      if (flushTimer) {
        return;
      }
      flushIn(retryDelay);
      retryDelay = Math.min(retryDelay * 2, MAX_DELAY);
    }
    async function send(envelope, isRetry = false) {
      if (!isRetry && envelopeContainsItemType(envelope, ["replay_event", "replay_recording"])) {
        await store.push(envelope);
        flushIn(MIN_DELAY);
        return {};
      }
      try {
        if (options.shouldSend && await options.shouldSend(envelope) === false) {
          throw new Error("Envelope not sent because `shouldSend` callback returned false");
        }
        const result = await transport.send(envelope);
        let delay = MIN_DELAY;
        if (result) {
          if (result.headers?.["retry-after"]) {
            delay = parseRetryAfterHeader(result.headers["retry-after"]);
          } else if (result.headers?.["x-sentry-rate-limits"]) {
            delay = 6e4;
          } else if ((result.statusCode || 0) >= 400) {
            return result;
          }
        }
        flushIn(delay);
        retryDelay = START_DELAY;
        return result;
      } catch (e2) {
        if (await shouldQueue(envelope, e2, retryDelay)) {
          if (isRetry) {
            await store.unshift(envelope);
          } else {
            await store.push(envelope);
          }
          flushWithBackOff();
          log("Error sending. Event queued.", e2);
          return {};
        } else {
          throw e2;
        }
      }
    }
    if (options.flushAtStartup) {
      flushWithBackOff();
    }
    return {
      send,
      flush: (timeout) => {
        if (timeout === void 0) {
          retryDelay = START_DELAY;
          flushIn(MIN_DELAY);
        }
        return transport.flush(timeout);
      }
    };
  };
}
const MULTIPLEXED_TRANSPORT_EXTRA_KEY = "MULTIPLEXED_TRANSPORT_EXTRA_KEY";
function eventFromEnvelope(env, types) {
  let event;
  forEachEnvelopeItem(env, (item, type) => {
    if (types.includes(type)) {
      event = Array.isArray(item) ? item[1] : void 0;
    }
    return !!event;
  });
  return event;
}
function makeOverrideReleaseTransport(createTransport2, release) {
  return (options) => {
    const transport = createTransport2(options);
    return {
      ...transport,
      send: async (envelope) => {
        const event = eventFromEnvelope(envelope, ["event", "transaction", "profile", "replay_event"]);
        if (event) {
          event.release = release;
        }
        return transport.send(envelope);
      }
    };
  };
}
function overrideDsn(envelope, dsn) {
  return createEnvelope(
    dsn ? {
      ...envelope[0],
      dsn
    } : envelope[0],
    envelope[1]
  );
}
function makeMultiplexedTransport(createTransport2, matcher) {
  return (options) => {
    const fallbackTransport = createTransport2(options);
    const otherTransports = /* @__PURE__ */ new Map();
    const actualMatcher = matcher || ((args) => {
      const event = args.getEvent();
      if (event?.extra?.[MULTIPLEXED_TRANSPORT_EXTRA_KEY] && Array.isArray(event.extra[MULTIPLEXED_TRANSPORT_EXTRA_KEY])) {
        return event.extra[MULTIPLEXED_TRANSPORT_EXTRA_KEY];
      }
      return [];
    });
    function getTransport(dsn, release) {
      const key = release ? `${dsn}:${release}` : dsn;
      let transport = otherTransports.get(key);
      if (!transport) {
        const validatedDsn = dsnFromString(dsn);
        if (!validatedDsn) {
          return void 0;
        }
        const url = getEnvelopeEndpointWithUrlEncodedAuth(validatedDsn, options.tunnel);
        transport = release ? makeOverrideReleaseTransport(createTransport2, release)({ ...options, url }) : createTransport2({ ...options, url });
        otherTransports.set(key, transport);
      }
      return [dsn, transport];
    }
    async function send(envelope) {
      function getEvent(types) {
        const eventTypes = types?.length ? types : ["event"];
        return eventFromEnvelope(envelope, eventTypes);
      }
      const transports = actualMatcher({ envelope, getEvent }).map((result) => {
        if (typeof result === "string") {
          return getTransport(result, void 0);
        } else {
          return getTransport(result.dsn, result.release);
        }
      }).filter((t2) => !!t2);
      const transportsWithFallback = transports.length ? transports : [["", fallbackTransport]];
      const results = await Promise.all(
        transportsWithFallback.map(([dsn, transport]) => transport.send(overrideDsn(envelope, dsn)))
      );
      return results[0];
    }
    async function flush(timeout) {
      const allTransports = [...otherTransports.values(), fallbackTransport];
      const results = await Promise.all(allTransports.map((transport) => transport.flush(timeout)));
      return results.every((r2) => r2);
    }
    return {
      send,
      flush
    };
  };
}
function filterCookies(cookieString, behavior) {
  if (behavior === false) {
    return {};
  }
  try {
    const parsed = parseCookie(cookieString);
    if (Object.keys(parsed).length === 0) {
      return {};
    }
    return filterKeyValueData(parsed, behavior, SENSITIVE_COOKIE_NAME_SNIPPETS);
  } catch {
    return FILTERED_VALUE;
  }
}
function parameterize(strings, ...values) {
  const formatted = new String(String.raw(strings, ...values));
  formatted.__sentry_template_string__ = strings.join("\0").replace(/%/g, "%%").replace(/\0/g, "%s");
  formatted.__sentry_template_values__ = values;
  return formatted;
}
const fmt = parameterize;
function addAutoIpAddressToSession(session) {
  if ("aggregates" in session) {
    if (session.attrs?.["ip_address"] === void 0) {
      session.attrs = {
        ...session.attrs,
        ip_address: "{{auto}}"
      };
    }
  } else {
    if (session.ipAddress === void 0) {
      session.ipAddress = "{{auto}}";
    }
  }
}
function debounce$1(func, wait, options) {
  let callbackReturnValue;
  let timerId;
  let maxTimerId;
  const maxWait = options?.maxWait ? Math.max(options.maxWait, wait) : 0;
  const setTimeoutImpl = options?.setTimeoutImpl || setTimeout;
  function invokeFunc() {
    cancelTimers();
    callbackReturnValue = func();
    return callbackReturnValue;
  }
  function cancelTimers() {
    timerId !== void 0 && clearTimeout(timerId);
    maxTimerId !== void 0 && clearTimeout(maxTimerId);
    timerId = maxTimerId = void 0;
  }
  function flush() {
    if (timerId !== void 0 || maxTimerId !== void 0) {
      return invokeFunc();
    }
    return callbackReturnValue;
  }
  function debounced() {
    if (timerId) {
      clearTimeout(timerId);
    }
    timerId = setTimeoutImpl(invokeFunc, wait);
    if (maxWait && maxTimerId === void 0) {
      maxTimerId = setTimeoutImpl(invokeFunc, maxWait);
    }
    return callbackReturnValue;
  }
  debounced.cancel = cancelTimers;
  debounced.flush = flush;
  return debounced;
}
const filenameMetadataMap = /* @__PURE__ */ new Map();
const parsedStacks = /* @__PURE__ */ new Set();
function ensureMetadataStacksAreParsed(parser) {
  if (!GLOBAL_OBJ._sentryModuleMetadata) {
    return;
  }
  for (const stack of Object.keys(GLOBAL_OBJ._sentryModuleMetadata)) {
    const metadata = GLOBAL_OBJ._sentryModuleMetadata[stack];
    if (parsedStacks.has(stack)) {
      continue;
    }
    parsedStacks.add(stack);
    const frames = parser(stack);
    for (const frame of frames.reverse()) {
      if (frame.filename) {
        filenameMetadataMap.set(frame.filename, metadata);
        break;
      }
    }
  }
}
function getMetadataForUrl(parser, filename) {
  ensureMetadataStacksAreParsed(parser);
  return filenameMetadataMap.get(filename);
}
function addMetadataToStackFrames(parser, event) {
  event.exception?.values?.forEach((exception) => {
    exception.stacktrace?.frames?.forEach((frame) => {
      if (!frame.filename || frame.module_metadata) {
        return;
      }
      const metadata = getMetadataForUrl(parser, frame.filename);
      if (metadata) {
        frame.module_metadata = metadata;
      }
    });
  });
}
function stripMetadataFromStackFrames(event) {
  event.exception?.values?.forEach((exception) => {
    exception.stacktrace?.frames?.forEach((frame) => {
      delete frame.module_metadata;
    });
  });
}
const moduleMetadataIntegration = defineIntegration(() => {
  return {
    name: "ModuleMetadata",
    setup(client) {
      client.on("beforeEnvelope", (envelope) => {
        forEachEnvelopeItem(envelope, (item, type) => {
          if (type === "event") {
            const event = Array.isArray(item) ? item[1] : void 0;
            if (event) {
              stripMetadataFromStackFrames(event);
              item[1] = event;
            }
          }
        });
      });
      client.on("applyFrameMetadata", (event) => {
        if (event.type) {
          return;
        }
        const stackParser = client.getOptions().stackParser;
        addMetadataToStackFrames(stackParser, event);
      });
    }
  };
});
const INTEGRATION_NAME$j = "CaptureConsole";
const _captureConsoleIntegration = ((options = {}) => {
  const levels = options.levels || CONSOLE_LEVELS$1;
  const handled = options.handled ?? true;
  return {
    name: INTEGRATION_NAME$j,
    setup(client) {
      if (!("console" in GLOBAL_OBJ)) {
        return;
      }
      addConsoleInstrumentationHandler(({ args, level }) => {
        if (getClient() !== client || !levels.includes(level)) {
          return;
        }
        consoleHandler(args, level, handled);
      });
    }
  };
});
const captureConsoleIntegration = defineIntegration(_captureConsoleIntegration);
function consoleHandler(args, level, handled) {
  const severityLevel = severityLevelFromString(level);
  const syntheticException = new Error();
  const captureContext = {
    level: severityLevelFromString(level),
    extra: {
      arguments: args
    }
  };
  withScope((scope) => {
    scope.addEventProcessor((event) => {
      event.logger = "console";
      addExceptionMechanism(event, {
        handled,
        type: "auto.core.capture_console"
      });
      return event;
    });
    if (level === "assert") {
      if (!args[0]) {
        const message2 = `Assertion failed: ${safeJoin(args.slice(1), " ") || "console.assert"}`;
        scope.setExtra("arguments", args.slice(1));
        scope.captureMessage(message2, severityLevel, { captureContext, syntheticException });
      }
      return;
    }
    const error2 = args.find((arg) => arg instanceof Error);
    if (error2) {
      captureException(error2, captureContext);
      return;
    }
    const message = safeJoin(args, " ");
    scope.captureMessage(message, severityLevel, { captureContext, syntheticException });
  });
}
const INTEGRATION_NAME$i = "ExtraErrorData";
const _extraErrorDataIntegration = ((options = {}) => {
  const { depth = 3, captureErrorCause = true } = options;
  return {
    name: INTEGRATION_NAME$i,
    processEvent(event, hint, client) {
      const { maxValueLength } = client.getOptions();
      return _enhanceEventWithErrorData(event, hint, depth, captureErrorCause, maxValueLength);
    }
  };
});
const extraErrorDataIntegration = defineIntegration(_extraErrorDataIntegration);
function _enhanceEventWithErrorData(event, hint = {}, depth, captureErrorCause, maxValueLength) {
  if (!hint.originalException || !isError(hint.originalException)) {
    return event;
  }
  const exceptionName = hint.originalException.name || hint.originalException.constructor.name;
  const errorData = _extractErrorData(hint.originalException, captureErrorCause, maxValueLength);
  if (errorData) {
    const contexts = {
      ...event.contexts
    };
    const normalizedErrorData = normalize(errorData, depth);
    if (isPlainObject(normalizedErrorData)) {
      setSkipNormalizationHint(normalizedErrorData);
      contexts[exceptionName] = normalizedErrorData;
    }
    return {
      ...event,
      contexts
    };
  }
  return event;
}
function _extractErrorData(error2, captureErrorCause, maxValueLength) {
  try {
    const nativeKeys = [
      "name",
      "message",
      "stack",
      "line",
      "column",
      "fileName",
      "lineNumber",
      "columnNumber",
      "toJSON"
    ];
    const extraErrorInfo = {};
    for (const key of Object.keys(error2)) {
      if (nativeKeys.indexOf(key) !== -1) {
        continue;
      }
      const value = error2[key];
      extraErrorInfo[key] = isError(value) || typeof value === "string" ? maxValueLength ? truncate(`${value}`, maxValueLength) : `${value}` : value;
    }
    if (captureErrorCause && error2.cause !== void 0) {
      if (isError(error2.cause)) {
        const errorName = error2.cause.name || error2.cause.constructor.name;
        extraErrorInfo.cause = { [errorName]: _extractErrorData(error2.cause, false, maxValueLength) };
      } else {
        extraErrorInfo.cause = error2.cause;
      }
    }
    if (typeof error2.toJSON === "function") {
      const serializedError = error2.toJSON();
      for (const key of Object.keys(serializedError)) {
        const value = serializedError[key];
        extraErrorInfo[key] = isError(value) ? value.toString() : value;
      }
    }
    return extraErrorInfo;
  } catch (oO) {
    DEBUG_BUILD$5 && debug$2.error("Unable to extract extra data from the Error object:", oO);
  }
  return null;
}
const INTEGRATION_NAME$h = "RewriteFrames";
const rewriteFramesIntegration = defineIntegration((options = {}) => {
  const root = options.root;
  const prefix = options.prefix || "app:///";
  const isBrowser2 = "window" in GLOBAL_OBJ && !!GLOBAL_OBJ.window;
  const iteratee = options.iteratee || generateIteratee({ isBrowser: isBrowser2, root, prefix });
  function _processExceptionsEvent(event) {
    try {
      return {
        ...event,
        exception: {
          ...event.exception,
          // The check for this is performed inside `process` call itself, safe to skip here
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          values: event.exception.values.map((value) => ({
            ...value,
            ...value.stacktrace && { stacktrace: _processStacktrace(value.stacktrace) }
          }))
        }
      };
    } catch {
      return event;
    }
  }
  function _processStacktrace(stacktrace) {
    return {
      ...stacktrace,
      frames: stacktrace?.frames?.map((f2) => iteratee(f2))
    };
  }
  return {
    name: INTEGRATION_NAME$h,
    processEvent(originalEvent) {
      let processedEvent = originalEvent;
      if (originalEvent.exception && Array.isArray(originalEvent.exception.values)) {
        processedEvent = _processExceptionsEvent(processedEvent);
      }
      return processedEvent;
    }
  };
});
function generateIteratee({
  isBrowser: isBrowser2,
  root,
  prefix
}) {
  return (frame) => {
    if (!frame.filename) {
      return frame;
    }
    const isWindowsFrame = /^[a-zA-Z]:\\/.test(frame.filename) || // or the presence of a backslash without a forward slash (which are not allowed on Windows)
    frame.filename.includes("\\") && !frame.filename.includes("/");
    const startsWithSlash = /^\//.test(frame.filename);
    if (isBrowser2) {
      if (root) {
        const oldFilename = frame.filename;
        if (oldFilename.indexOf(root) === 0) {
          frame.filename = oldFilename.replace(root, prefix);
        }
      }
    } else {
      if (isWindowsFrame || startsWithSlash) {
        const filename = isWindowsFrame ? frame.filename.replace(/^[a-zA-Z]:/, "").replace(/\\/g, "/") : frame.filename;
        const base = root ? relative(root, filename) : basename(filename);
        frame.filename = `${prefix}${base}`;
      }
    }
    return frame;
  };
}
const AUTH_OPERATIONS_TO_INSTRUMENT = [
  "reauthenticate",
  "signInAnonymously",
  "signInWithOAuth",
  "signInWithIdToken",
  "signInWithOtp",
  "signInWithPassword",
  "signInWithSSO",
  "signOut",
  "signUp",
  "verifyOtp"
];
const AUTH_ADMIN_OPERATIONS_TO_INSTRUMENT = [
  "createUser",
  "deleteUser",
  "listUsers",
  "getUserById",
  "updateUserById",
  "inviteUserByEmail"
];
const FILTER_MAPPINGS = {
  eq: "eq",
  neq: "neq",
  gt: "gt",
  gte: "gte",
  lt: "lt",
  lte: "lte",
  like: "like",
  "like(all)": "likeAllOf",
  "like(any)": "likeAnyOf",
  ilike: "ilike",
  "ilike(all)": "ilikeAllOf",
  "ilike(any)": "ilikeAnyOf",
  is: "is",
  in: "in",
  cs: "contains",
  cd: "containedBy",
  sr: "rangeGt",
  nxl: "rangeGte",
  sl: "rangeLt",
  nxr: "rangeLte",
  adj: "rangeAdjacent",
  ov: "overlaps",
  fts: "",
  plfts: "plain",
  phfts: "phrase",
  wfts: "websearch",
  not: "not"
};
const DB_OPERATIONS_TO_INSTRUMENT = ["select", "insert", "upsert", "update", "delete"];
function markAsInstrumented(fn) {
  try {
    fn.__SENTRY_INSTRUMENTED__ = true;
  } catch {
  }
}
function isInstrumented(fn) {
  try {
    return fn.__SENTRY_INSTRUMENTED__;
  } catch {
    return false;
  }
}
function getMutationBodyPayloadForTelemetry(rawBody, plainBody) {
  if (Object.keys(plainBody).length > 0) {
    return plainBody;
  }
  if (Array.isArray(rawBody) && rawBody.length > 0) {
    return rawBody;
  }
  return void 0;
}
function hasMutationBodyForDescription(rawBody, plainBody) {
  return getMutationBodyPayloadForTelemetry(rawBody, plainBody) !== void 0;
}
function extractOperation(method, headers = {}) {
  switch (method) {
    case "GET": {
      return "select";
    }
    case "POST": {
      if (headers["Prefer"]?.includes("resolution=")) {
        return "upsert";
      } else {
        return "insert";
      }
    }
    case "PATCH": {
      return "update";
    }
    case "DELETE": {
      return "delete";
    }
    default: {
      return "<unknown-op>";
    }
  }
}
function translateFiltersIntoMethods(key, query) {
  if (query === "" || query === "*") {
    return "select(*)";
  }
  if (key === "select") {
    return `select(${query})`;
  }
  if (key === "or" || key.endsWith(".or")) {
    return `${key}${query}`;
  }
  const [filter, ...value] = query.split(".");
  let method;
  if (filter?.startsWith("fts")) {
    method = "textSearch";
  } else if (filter?.startsWith("plfts")) {
    method = "textSearch[plain]";
  } else if (filter?.startsWith("phfts")) {
    method = "textSearch[phrase]";
  } else if (filter?.startsWith("wfts")) {
    method = "textSearch[websearch]";
  } else {
    method = filter && FILTER_MAPPINGS[filter] || "filter";
  }
  return `${method}(${key}, ${value.join(".")})`;
}
function instrumentAuthOperation(operation, isAdmin = false) {
  return new Proxy(operation, {
    apply(target, thisArg, argumentsList) {
      return startSpan(
        {
          name: `auth ${isAdmin ? "(admin) " : ""}${operation.name}`,
          attributes: {
            [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.db.supabase",
            [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "db",
            "db.system": "postgresql",
            "db.operation": `auth.${isAdmin ? "admin." : ""}${operation.name}`
          }
        },
        (span) => {
          return Reflect.apply(target, thisArg, argumentsList).then((res) => {
            if (res && typeof res === "object" && "error" in res && res.error) {
              span.setStatus({ code: SPAN_STATUS_ERROR });
              captureException(res.error, {
                mechanism: {
                  handled: false,
                  type: "auto.db.supabase.auth"
                }
              });
            } else {
              span.setStatus({ code: SPAN_STATUS_OK });
            }
            span.end();
            return res;
          }).catch((err) => {
            span.setStatus({ code: SPAN_STATUS_ERROR });
            span.end();
            captureException(err, {
              mechanism: {
                handled: false,
                type: "auto.db.supabase.auth"
              }
            });
            throw err;
          }).then(...argumentsList);
        }
      );
    }
  });
}
function instrumentSupabaseAuthClient(supabaseClientInstance) {
  const auth = supabaseClientInstance.auth;
  if (!auth || isInstrumented(supabaseClientInstance.auth)) {
    return;
  }
  for (const operation of AUTH_OPERATIONS_TO_INSTRUMENT) {
    const authOperation = auth[operation];
    if (!authOperation) {
      continue;
    }
    if (typeof supabaseClientInstance.auth[operation] === "function") {
      supabaseClientInstance.auth[operation] = instrumentAuthOperation(authOperation);
    }
  }
  for (const operation of AUTH_ADMIN_OPERATIONS_TO_INSTRUMENT) {
    const authOperation = auth.admin[operation];
    if (!authOperation) {
      continue;
    }
    if (typeof supabaseClientInstance.auth.admin[operation] === "function") {
      supabaseClientInstance.auth.admin[operation] = instrumentAuthOperation(authOperation, true);
    }
  }
  markAsInstrumented(supabaseClientInstance.auth);
}
function instrumentSupabaseClientConstructor(SupabaseClient, _options) {
  if (isInstrumented(SupabaseClient.prototype.from)) {
    return;
  }
  SupabaseClient.prototype.from = new Proxy(
    SupabaseClient.prototype.from,
    {
      apply(target, thisArg, argumentsList) {
        const rv = Reflect.apply(target, thisArg, argumentsList);
        const PostgRESTQueryBuilder = rv.constructor;
        instrumentPostgRESTQueryBuilder(PostgRESTQueryBuilder, _options);
        return rv;
      }
    }
  );
  markAsInstrumented(SupabaseClient.prototype.from);
}
function instrumentPostgRESTFilterBuilder(PostgRESTFilterBuilder, _options) {
  if (isInstrumented(PostgRESTFilterBuilder.prototype.then)) {
    return;
  }
  PostgRESTFilterBuilder.prototype.then = new Proxy(
    PostgRESTFilterBuilder.prototype.then,
    {
      apply(target, thisArg, argumentsList) {
        const operations = DB_OPERATIONS_TO_INSTRUMENT;
        const typedThis = thisArg;
        const operation = extractOperation(typedThis.method, typedThis.headers);
        if (!operations.includes(operation)) {
          return Reflect.apply(target, thisArg, argumentsList);
        }
        if (!typedThis?.url?.pathname || typeof typedThis.url.pathname !== "string") {
          return Reflect.apply(target, thisArg, argumentsList);
        }
        const pathParts = typedThis.url.pathname.split("/");
        const table = pathParts.length > 0 ? pathParts[pathParts.length - 1] : "";
        const queryItems = [];
        for (const [key, value] of typedThis.url.searchParams.entries()) {
          queryItems.push(translateFiltersIntoMethods(key, value));
        }
        const body = /* @__PURE__ */ Object.create(null);
        if (isPlainObject(typedThis.body)) {
          for (const [key, value] of Object.entries(typedThis.body)) {
            body[key] = value;
          }
        }
        const client = getClient();
        const shouldSendData = _options.sendOperationData ?? client?.getDataCollectionOptions().userInfo === true;
        const bodyPayload = getMutationBodyPayloadForTelemetry(typedThis.body, body);
        const mutationPart = operation === "select" ? "" : `${operation}${hasMutationBodyForDescription(typedThis.body, body) ? "(...) " : ""}`;
        const queryPart = shouldSendData ? queryItems.join(" ") : queryItems.length > 0 ? "[redacted]" : "";
        const descriptionMiddle = [mutationPart.trimEnd(), queryPart].filter(Boolean).join(" ");
        const description = descriptionMiddle ? `${descriptionMiddle} from(${table})` : `from(${table})`;
        const attributes = {
          "db.table": table,
          "db.schema": typedThis.schema,
          "db.url": typedThis.url.origin,
          "db.sdk": typedThis.headers["X-Client-Info"],
          "db.system": "postgresql",
          "db.operation": operation,
          [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.db.supabase",
          [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "db"
        };
        if (queryItems.length && shouldSendData) {
          attributes["db.query"] = queryItems;
        }
        if (bodyPayload !== void 0 && shouldSendData) {
          attributes["db.body"] = bodyPayload;
        }
        return startSpan(
          {
            name: description,
            attributes
          },
          (span) => {
            return Reflect.apply(target, thisArg, []).then(
              (res) => {
                if (span) {
                  if (res && typeof res === "object" && "status" in res) {
                    setHttpStatus(span, res.status || 500);
                  }
                  span.end();
                }
                if (res?.error) {
                  const err = new Error(res.error.message);
                  if (res.error.code) {
                    err.code = res.error.code;
                  }
                  if (res.error.details) {
                    err.details = res.error.details;
                  }
                  const supabaseContext = {};
                  if (queryItems.length && shouldSendData) {
                    supabaseContext.query = queryItems;
                  }
                  if (bodyPayload !== void 0 && shouldSendData) {
                    supabaseContext.body = bodyPayload;
                  }
                  captureException(err, (scope) => {
                    scope.addEventProcessor((e2) => {
                      addExceptionMechanism(e2, {
                        handled: false,
                        type: "auto.db.supabase.postgres"
                      });
                      return e2;
                    });
                    scope.setContext("supabase", supabaseContext);
                    return scope;
                  });
                }
                const breadcrumb = {
                  type: "supabase",
                  category: `db.${operation}`,
                  message: description
                };
                const data = {};
                if (queryItems.length && shouldSendData) {
                  data.query = queryItems;
                }
                if (bodyPayload !== void 0 && shouldSendData) {
                  data.body = bodyPayload;
                }
                if (Object.keys(data).length) {
                  breadcrumb.data = data;
                }
                addBreadcrumb(breadcrumb);
                return res;
              },
              (err) => {
                if (span) {
                  setHttpStatus(span, 500);
                  span.end();
                }
                throw err;
              }
            ).then(...argumentsList);
          }
        );
      }
    }
  );
  markAsInstrumented(PostgRESTFilterBuilder.prototype.then);
}
function instrumentPostgRESTQueryBuilder(PostgRESTQueryBuilder, _options) {
  for (const operation of DB_OPERATIONS_TO_INSTRUMENT) {
    if (isInstrumented(PostgRESTQueryBuilder.prototype[operation])) {
      continue;
    }
    PostgRESTQueryBuilder.prototype[operation] = new Proxy(
      PostgRESTQueryBuilder.prototype[operation],
      {
        apply(target, thisArg, argumentsList) {
          const rv = Reflect.apply(target, thisArg, argumentsList);
          const PostgRESTFilterBuilder = rv.constructor;
          DEBUG_BUILD$5 && debug$2.log(`Instrumenting ${operation} operation's PostgRESTFilterBuilder`);
          instrumentPostgRESTFilterBuilder(PostgRESTFilterBuilder, _options);
          return rv;
        }
      }
    );
    markAsInstrumented(PostgRESTQueryBuilder.prototype[operation]);
  }
}
const instrumentSupabaseClient = (supabaseClient, options = {}) => {
  if (!supabaseClient) {
    DEBUG_BUILD$5 && debug$2.warn("Supabase integration was not installed because no Supabase client was provided.");
    return;
  }
  const SupabaseClientConstructor = supabaseClient.constructor === Function ? supabaseClient : supabaseClient.constructor;
  instrumentSupabaseClientConstructor(SupabaseClientConstructor, options);
  instrumentSupabaseAuthClient(supabaseClient);
};
const INTEGRATION_NAME$g = "Supabase";
const _supabaseIntegration = ((supabaseClient, options) => {
  return {
    setupOnce() {
      instrumentSupabaseClient(supabaseClient, options);
    },
    name: INTEGRATION_NAME$g
  };
});
const supabaseIntegration = defineIntegration((options) => {
  return _supabaseIntegration(options.supabaseClient, { sendOperationData: options.sendOperationData });
});
const DEFAULT_LIMIT$1 = 10;
const INTEGRATION_NAME$f = "ZodErrors";
function originalExceptionIsZodError(originalException) {
  return isError(originalException) && originalException.name === "ZodError" && Array.isArray(originalException.issues);
}
function flattenIssue(issue) {
  return {
    ...issue,
    path: "path" in issue && Array.isArray(issue.path) ? issue.path.join(".") : void 0,
    keys: "keys" in issue ? JSON.stringify(issue.keys) : void 0,
    unionErrors: "unionErrors" in issue ? JSON.stringify(issue.unionErrors) : void 0
  };
}
function flattenIssuePath(path) {
  return path.map((p2) => {
    if (typeof p2 === "number") {
      return "<array>";
    } else {
      return p2;
    }
  }).join(".");
}
function formatIssueMessage(zodError) {
  const errorKeyMap = /* @__PURE__ */ new Set();
  for (const iss of zodError.issues) {
    const issuePath = flattenIssuePath(iss.path);
    if (issuePath.length > 0) {
      errorKeyMap.add(issuePath);
    }
  }
  const errorKeys = Array.from(errorKeyMap);
  if (errorKeys.length === 0) {
    let rootExpectedType = "variable";
    if (zodError.issues.length > 0) {
      const iss = zodError.issues[0];
      if (iss !== void 0 && "expected" in iss && typeof iss.expected === "string") {
        rootExpectedType = iss.expected;
      }
    }
    return `Failed to validate ${rootExpectedType}`;
  }
  return `Failed to validate keys: ${truncate(errorKeys.join(", "), 100)}`;
}
function applyZodErrorsToEvent(limit, saveZodIssuesAsAttachment = false, event, hint) {
  if (!event.exception?.values || !hint.originalException || !originalExceptionIsZodError(hint.originalException) || hint.originalException.issues.length === 0) {
    return event;
  }
  try {
    const issuesToFlatten = saveZodIssuesAsAttachment ? hint.originalException.issues : hint.originalException.issues.slice(0, limit);
    const flattenedIssues = issuesToFlatten.map(flattenIssue);
    if (saveZodIssuesAsAttachment) {
      if (!Array.isArray(hint.attachments)) {
        hint.attachments = [];
      }
      hint.attachments.push({
        filename: "zod_issues.json",
        data: JSON.stringify({
          issues: flattenedIssues
        })
      });
    }
    return {
      ...event,
      exception: {
        ...event.exception,
        values: [
          {
            ...event.exception.values[0],
            value: formatIssueMessage(hint.originalException)
          },
          ...event.exception.values.slice(1)
        ]
      },
      extra: {
        ...event.extra,
        "zoderror.issues": flattenedIssues.slice(0, limit)
      }
    };
  } catch (e2) {
    return {
      ...event,
      extra: {
        ...event.extra,
        "zoderrors sentry integration parse error": {
          message: "an exception was thrown while processing ZodError within applyZodErrorsToEvent()",
          error: e2 instanceof Error ? `${e2.name}: ${e2.message}
${e2.stack}` : "unknown"
        }
      }
    };
  }
}
const _zodErrorsIntegration = ((options = {}) => {
  const limit = options.limit ?? DEFAULT_LIMIT$1;
  return {
    name: INTEGRATION_NAME$f,
    processEvent(originalEvent, hint) {
      const processedEvent = applyZodErrorsToEvent(limit, options.saveZodIssuesAsAttachment, originalEvent, hint);
      return processedEvent;
    }
  };
});
const zodErrorsIntegration = defineIntegration(_zodErrorsIntegration);
const thirdPartyErrorFilterIntegration = defineIntegration((options) => {
  return {
    name: "ThirdPartyErrorsFilter",
    setup(client) {
      client.on("beforeEnvelope", (envelope) => {
        forEachEnvelopeItem(envelope, (item, type) => {
          if (type === "event") {
            const event = Array.isArray(item) ? item[1] : void 0;
            if (event) {
              stripMetadataFromStackFrames(event);
              item[1] = event;
            }
          }
        });
      });
      client.on("applyFrameMetadata", (event) => {
        if (event.type) {
          return;
        }
        const stackParser = client.getOptions().stackParser;
        addMetadataToStackFrames(stackParser, event);
      });
    },
    preprocessEvent(event) {
      if (options.ignoreSentryInternalFrames && (GLOBAL_OBJ._sentryWrappedDepth ?? 0) > 0) {
        event.sdkProcessingMetadata = {
          ...event.sdkProcessingMetadata,
          insideSentryWrapped: true
        };
      }
    },
    processEvent(event) {
      const insideSentryWrapped = options.ignoreSentryInternalFrames ? event.sdkProcessingMetadata?.insideSentryWrapped === true && event.exception?.values?.length === 1 : false;
      const frameKeys = getBundleKeysForAllFramesWithFilenames(
        event,
        options.ignoreSentryInternalFrames,
        insideSentryWrapped
      );
      if (frameKeys) {
        const arrayMethod = options.behaviour === "drop-error-if-contains-third-party-frames" || options.behaviour === "apply-tag-if-contains-third-party-frames" ? "some" : "every";
        const behaviourApplies = frameKeys[arrayMethod]((keys2) => !keys2.some((key) => options.filterKeys.includes(key)));
        if (behaviourApplies) {
          const shouldDrop = options.behaviour === "drop-error-if-contains-third-party-frames" || options.behaviour === "drop-error-if-exclusively-contains-third-party-frames";
          if (shouldDrop) {
            return null;
          } else {
            event.tags = {
              ...event.tags,
              third_party_code: true
            };
          }
        }
      }
      return event;
    }
  };
});
function isSentryInternalFrame(frame, frameIndex, insideSentryWrapped) {
  if (frameIndex !== 0) {
    return false;
  }
  if (insideSentryWrapped && isLikelyMinifiedSentryWrappedFrame(frame)) {
    return true;
  }
  if (frame.function === "sentryWrapped") {
    return true;
  }
  if (!frame.context_line || !frame.filename) {
    return false;
  }
  if (!frame.filename.includes("sentry") || !frame.filename.includes("helpers") || // Filename would look something like this: 'node_modules/@sentry/browser/build/npm/esm/helpers.js'
  !frame.context_line.includes(SENTRY_INTERNAL_FN_APPLY)) {
    return false;
  }
  if (frame.pre_context) {
    const len = frame.pre_context.length;
    for (let i = 0; i < len; i++) {
      if (frame.pre_context[i]?.includes(SENTRY_INTERNAL_COMMENT)) {
        return true;
      }
    }
  }
  return false;
}
function getBundleKeysForAllFramesWithFilenames(event, ignoreSentryInternalFrames, insideSentryWrapped) {
  const frames = getFramesFromEvent(event);
  if (!frames) {
    return void 0;
  }
  return frames.filter((frame, index) => {
    if (!frame.filename) {
      return false;
    }
    if (frame.lineno == null && frame.colno == null && frame.instruction_addr == null) {
      return false;
    }
    return !ignoreSentryInternalFrames || !isSentryInternalFrame(frame, index, !!insideSentryWrapped);
  }).map((frame) => {
    if (!frame.module_metadata) {
      return [];
    }
    return Object.keys(frame.module_metadata).filter((key) => key.startsWith(BUNDLER_PLUGIN_APP_KEY_PREFIX)).map((key) => key.slice(BUNDLER_PLUGIN_APP_KEY_PREFIX.length));
  });
}
function isLikelyMinifiedSentryWrappedFrame(frame) {
  return !frame.context_line && !frame.pre_context && !!frame.function && frame.function.length <= 2;
}
const BUNDLER_PLUGIN_APP_KEY_PREFIX = "_sentryBundlerPluginAppKey:";
const SENTRY_INTERNAL_COMMENT = "Attempt to invoke user-land function";
const SENTRY_INTERNAL_FN_APPLY = "fn.apply(this, wrappedArguments)";
const _INTERNAL_FLAG_BUFFER_SIZE = 100;
const _INTERNAL_MAX_FLAGS_PER_SPAN = 10;
const SPAN_FLAG_ATTRIBUTE_PREFIX = "flag.evaluation.";
function _INTERNAL_copyFlagsFromScopeToEvent(event) {
  if (event.type) {
    return event;
  }
  const scope = getCurrentScope();
  const flagContext = scope.getScopeData().contexts.flags;
  const flagBuffer = flagContext ? flagContext.values : [];
  if (!flagBuffer.length) {
    return event;
  }
  if (event.contexts === void 0) {
    event.contexts = {};
  }
  event.contexts.flags = { values: [...flagBuffer] };
  return event;
}
function _INTERNAL_insertFlagToScope(name, value, maxSize = _INTERNAL_FLAG_BUFFER_SIZE) {
  const scopeContexts = getCurrentScope().getScopeData().contexts;
  if (!scopeContexts.flags) {
    scopeContexts.flags = { values: [] };
  }
  const flags = scopeContexts.flags.values;
  _INTERNAL_insertToFlagBuffer(flags, name, value, maxSize);
}
function _INTERNAL_insertToFlagBuffer(flags, name, value, maxSize) {
  if (typeof value !== "boolean") {
    return;
  }
  if (flags.length > maxSize) {
    DEBUG_BUILD$5 && debug$2.error(`[Feature Flags] insertToFlagBuffer called on a buffer larger than maxSize=${maxSize}`);
    return;
  }
  const index = flags.findIndex((f2) => f2.flag === name);
  if (index !== -1) {
    flags.splice(index, 1);
  }
  if (flags.length === maxSize) {
    flags.shift();
  }
  flags.push({
    flag: name,
    result: value
  });
}
function _INTERNAL_addFeatureFlagToActiveSpan(name, value, maxFlagsPerSpan = _INTERNAL_MAX_FLAGS_PER_SPAN) {
  if (typeof value !== "boolean") {
    return;
  }
  const span = getActiveSpan();
  if (!span) {
    return;
  }
  const attributes = spanToJSON(span).data;
  if (`${SPAN_FLAG_ATTRIBUTE_PREFIX}${name}` in attributes) {
    span.setAttribute(`${SPAN_FLAG_ATTRIBUTE_PREFIX}${name}`, value);
    return;
  }
  const numOfAddedFlags = Object.keys(attributes).filter((key) => key.startsWith(SPAN_FLAG_ATTRIBUTE_PREFIX)).length;
  if (numOfAddedFlags < maxFlagsPerSpan) {
    span.setAttribute(`${SPAN_FLAG_ATTRIBUTE_PREFIX}${name}`, value);
  }
}
const featureFlagsIntegration = defineIntegration(() => {
  return {
    name: "FeatureFlags",
    processEvent(event, _hint, _client) {
      return _INTERNAL_copyFlagsFromScopeToEvent(event);
    },
    addFeatureFlag(name, value) {
      _INTERNAL_insertFlagToScope(name, value);
      _INTERNAL_addFeatureFlagToActiveSpan(name, value);
    }
  };
});
const growthbookIntegration$1 = defineIntegration(
  ({ growthbookClass }) => {
    return {
      name: "GrowthBook",
      setupOnce() {
        const proto = growthbookClass.prototype;
        if (typeof proto.isOn === "function") {
          fill(proto, "isOn", _wrapAndCaptureBooleanResult);
        }
        if (typeof proto.getFeatureValue === "function") {
          fill(proto, "getFeatureValue", _wrapAndCaptureBooleanResult);
        }
      },
      processEvent(event, _hint, _client) {
        return _INTERNAL_copyFlagsFromScopeToEvent(event);
      }
    };
  }
);
function _wrapAndCaptureBooleanResult(original) {
  return function(...args) {
    const flagName = args[0];
    const result = original.apply(this, args);
    if (typeof flagName === "string" && typeof result === "boolean") {
      _INTERNAL_insertFlagToScope(flagName, result);
      _INTERNAL_addFeatureFlagToActiveSpan(flagName, result);
    }
    return result;
  };
}
function captureFeedback(params, hint = {}, scope = getCurrentScope()) {
  const { message, name, email, url, source, associatedEventId, tags } = params;
  const feedbackEvent = {
    contexts: {
      feedback: {
        contact_email: email,
        name,
        message,
        url,
        source,
        associated_event_id: associatedEventId
      }
    },
    type: "feedback",
    level: "info",
    tags
  };
  const client = scope?.getClient() || getClient();
  if (client) {
    client.emit("beforeSendFeedback", feedbackEvent, hint);
  }
  const eventId = scope.captureEvent(feedbackEvent, hint);
  return eventId;
}
function captureLog(level, message, attributes, scope, severityNumber) {
  _INTERNAL_captureLog({ level, message, attributes, severityNumber }, scope);
}
function trace(message, attributes, { scope } = {}) {
  captureLog("trace", message, attributes, scope);
}
function debug$1(message, attributes, { scope } = {}) {
  captureLog("debug", message, attributes, scope);
}
function info(message, attributes, { scope } = {}) {
  captureLog("info", message, attributes, scope);
}
function warn(message, attributes, { scope } = {}) {
  captureLog("warn", message, attributes, scope);
}
function error(message, attributes, { scope } = {}) {
  captureLog("error", message, attributes, scope);
}
function fatal(message, attributes, { scope } = {}) {
  captureLog("fatal", message, attributes, scope);
}
const publicApi$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  debug: debug$1,
  error,
  fatal,
  fmt,
  info,
  trace,
  warn
}, Symbol.toStringTag, { value: "Module" }));
function formatConsoleArgs(values, normalizeDepth, normalizeMaxBreadth) {
  return "util" in GLOBAL_OBJ && typeof GLOBAL_OBJ.util.format === "function" ? GLOBAL_OBJ.util.format(...values) : safeJoinConsoleArgs(values, normalizeDepth, normalizeMaxBreadth);
}
function safeJoinConsoleArgs(values, normalizeDepth, normalizeMaxBreadth) {
  return values.map(
    (value) => isPrimitive(value) ? String(value) : JSON.stringify(normalize(value, normalizeDepth, normalizeMaxBreadth))
  ).join(" ");
}
function hasConsoleSubstitutions(str) {
  return /%[sdifocO]/.test(str);
}
function createConsoleTemplateAttributes(firstArg, followingArgs) {
  const attributes = {};
  const template = new Array(followingArgs.length).fill("{}").join(" ");
  attributes["sentry.message.template"] = `${firstArg} ${template}`;
  followingArgs.forEach((arg, index) => {
    attributes[`sentry.message.parameter.${index}`] = arg;
  });
  return attributes;
}
const INTEGRATION_NAME$e = "ConsoleLogs";
const DEFAULT_ATTRIBUTES = {
  [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.log.console"
};
const _consoleLoggingIntegration = ((options = {}) => {
  const levels = options.levels || CONSOLE_LEVELS$1;
  return {
    name: INTEGRATION_NAME$e,
    setup(client) {
      const { enableLogs, normalizeDepth = 3, normalizeMaxBreadth = 1e3 } = client.getOptions();
      if (!enableLogs) {
        DEBUG_BUILD$5 && debug$2.warn("`enableLogs` is not enabled, ConsoleLogs integration disabled");
        return;
      }
      const unsubscribe = addConsoleInstrumentationHandler(({ args, level }) => {
        if (getClient() !== client || !levels.includes(level)) {
          return;
        }
        const firstArg = args[0];
        const followingArgs = args.slice(1);
        if (level === "assert") {
          if (!firstArg) {
            const assertionMessage = followingArgs.length > 0 ? `Assertion failed: ${formatConsoleArgs(followingArgs, normalizeDepth, normalizeMaxBreadth)}` : "Assertion failed";
            _INTERNAL_captureLog({ level: "error", message: assertionMessage, attributes: DEFAULT_ATTRIBUTES });
          }
          return;
        }
        const isLevelLog = level === "log";
        const shouldGenerateTemplate = args.length > 1 && typeof args[0] === "string" && !hasConsoleSubstitutions(args[0]);
        const attributes = {
          ...DEFAULT_ATTRIBUTES,
          ...shouldGenerateTemplate ? createConsoleTemplateAttributes(firstArg, followingArgs) : {}
        };
        _INTERNAL_captureLog({
          level: isLevelLog ? "info" : level,
          message: formatConsoleArgs(args, normalizeDepth, normalizeMaxBreadth),
          severityNumber: isLevelLog ? 10 : void 0,
          attributes
        });
      });
      client.registerCleanup(unsubscribe);
    }
  };
});
const consoleLoggingIntegration = defineIntegration(_consoleLoggingIntegration);
function captureMetric(type, name, value, options) {
  _INTERNAL_captureMetric(
    { type, name, value, unit: options?.unit, attributes: options?.attributes },
    { scope: options?.scope }
  );
}
function count(name, value = 1, options) {
  captureMetric("counter", name, value, options);
}
function gauge(name, value, options) {
  captureMetric("gauge", name, value, options);
}
function distribution(name, value, options) {
  captureMetric("distribution", name, value, options);
}
const publicApi = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  count,
  distribution,
  gauge
}, Symbol.toStringTag, { value: "Module" }));
const DEFAULT_CAPTURED_LEVELS = ["trace", "debug", "info", "warn", "error", "fatal"];
function createConsolaReporter(options = {}) {
  const levels = new Set(options.levels ?? DEFAULT_CAPTURED_LEVELS);
  const providedClient = options.client;
  return {
    log(logObj) {
      const { type, level, message: consolaMessage, args, tag, date: _date, ...rest } = logObj;
      const client = providedClient || getClient();
      if (!client) {
        return;
      }
      const logSeverityLevel = getLogSeverityLevel(type, level);
      if (!levels.has(logSeverityLevel)) {
        return;
      }
      const { normalizeDepth = 3, normalizeMaxBreadth = 1e3 } = client.getOptions();
      const attributes = {};
      for (const [key, value] of Object.entries(rest)) {
        attributes[key] = normalize(value, normalizeDepth, normalizeMaxBreadth);
      }
      attributes["sentry.origin"] = "auto.log.consola";
      if (tag) {
        attributes["consola.tag"] = tag;
      }
      if (type) {
        attributes["consola.type"] = type;
      }
      if (level != null && typeof level === "number") {
        attributes["consola.level"] = level;
      }
      const extractionResult = processExtractedAttributes(
        defaultExtractAttributes(args, normalizeDepth, normalizeMaxBreadth),
        normalizeDepth,
        normalizeMaxBreadth
      );
      if (extractionResult?.attributes) {
        Object.assign(attributes, extractionResult.attributes);
      }
      _INTERNAL_captureLog({
        level: logSeverityLevel,
        message: extractionResult?.message || consolaMessage || args && formatConsoleArgs(args, normalizeDepth, normalizeMaxBreadth) || "",
        attributes
      });
    }
  };
}
const CONSOLA_TYPE_TO_LOG_SEVERITY_LEVEL_MAP = {
  // Consola built-in types
  silent: "trace",
  fatal: "fatal",
  error: "error",
  warn: "warn",
  log: "info",
  info: "info",
  success: "info",
  fail: "error",
  ready: "info",
  start: "info",
  box: "info",
  debug: "debug",
  trace: "trace",
  verbose: "debug",
  // Custom types that might exist
  critical: "fatal",
  notice: "info"
};
const CONSOLA_LEVEL_TO_LOG_SEVERITY_LEVEL_MAP = {
  0: "fatal",
  // Fatal and Error
  1: "warn",
  // Warnings
  2: "info",
  // Normal logs
  3: "info",
  // Informational logs, success, fail, ready, start, ...
  4: "debug",
  // Debug logs
  5: "trace"
  // Trace logs
};
function getLogSeverityLevel(type, level) {
  if (type === "verbose") {
    return "debug";
  }
  if (type === "silent") {
    return "trace";
  }
  if (type) {
    const mappedLevel = CONSOLA_TYPE_TO_LOG_SEVERITY_LEVEL_MAP[type];
    if (mappedLevel) {
      return mappedLevel;
    }
  }
  if (typeof level === "number") {
    const mappedLevel = CONSOLA_LEVEL_TO_LOG_SEVERITY_LEVEL_MAP[level];
    if (mappedLevel) {
      return mappedLevel;
    }
  }
  return "info";
}
function defaultExtractAttributes(args, normalizeDepth, normalizeMaxBreadth) {
  if (!args?.length) {
    return { message: "" };
  }
  const message = formatConsoleArgs(args, normalizeDepth, normalizeMaxBreadth);
  const firstArg = args[0];
  if (isPlainObject(firstArg)) {
    const remainingArgsStartIndex = typeof args[1] === "string" ? 2 : 1;
    const remainingArgs = args.slice(remainingArgsStartIndex);
    return {
      message,
      // Object content from first arg is added as attributes
      attributes: firstArg,
      // Add remaining args as message parameters
      messageParameters: remainingArgs
    };
  } else {
    const followingArgs = args.slice(1);
    const shouldAddTemplateAttr = followingArgs.length > 0 && typeof firstArg === "string" && !hasConsoleSubstitutions(firstArg);
    return {
      message,
      messageTemplate: shouldAddTemplateAttr ? firstArg : void 0,
      messageParameters: shouldAddTemplateAttr ? followingArgs : void 0
    };
  }
}
function processExtractedAttributes(extractionResult, normalizeDepth, normalizeMaxBreadth) {
  const { message, attributes, messageTemplate, messageParameters } = extractionResult;
  const messageParamAttributes = {};
  if (messageTemplate && messageParameters) {
    const templateAttrs = createConsoleTemplateAttributes(messageTemplate, messageParameters);
    for (const [key, value] of Object.entries(templateAttrs)) {
      messageParamAttributes[key] = key.startsWith("sentry.message.parameter.") ? normalize(value, normalizeDepth, normalizeMaxBreadth) : value;
    }
  } else if (messageParameters && messageParameters.length > 0) {
    messageParameters.forEach((arg, index) => {
      messageParamAttributes[`sentry.message.parameter.${index}`] = normalize(arg, normalizeDepth, normalizeMaxBreadth);
    });
  }
  return {
    message,
    attributes: {
      ...normalize(attributes, normalizeDepth, normalizeMaxBreadth),
      ...messageParamAttributes
    }
  };
}
const GEN_AI_PROMPT_ATTRIBUTE = "gen_ai.prompt";
const GEN_AI_SYSTEM_ATTRIBUTE = "gen_ai.system";
const GEN_AI_REQUEST_MODEL_ATTRIBUTE = "gen_ai.request.model";
const GEN_AI_REQUEST_STREAM_ATTRIBUTE = "gen_ai.request.stream";
const GEN_AI_REQUEST_TEMPERATURE_ATTRIBUTE = "gen_ai.request.temperature";
const GEN_AI_REQUEST_MAX_TOKENS_ATTRIBUTE = "gen_ai.request.max_tokens";
const GEN_AI_REQUEST_FREQUENCY_PENALTY_ATTRIBUTE = "gen_ai.request.frequency_penalty";
const GEN_AI_REQUEST_PRESENCE_PENALTY_ATTRIBUTE = "gen_ai.request.presence_penalty";
const GEN_AI_REQUEST_TOP_P_ATTRIBUTE = "gen_ai.request.top_p";
const GEN_AI_REQUEST_TOP_K_ATTRIBUTE = "gen_ai.request.top_k";
const GEN_AI_REQUEST_ENCODING_FORMAT_ATTRIBUTE = "gen_ai.request.encoding_format";
const GEN_AI_REQUEST_DIMENSIONS_ATTRIBUTE = "gen_ai.request.dimensions";
const GEN_AI_RESPONSE_FINISH_REASONS_ATTRIBUTE = "gen_ai.response.finish_reasons";
const GEN_AI_RESPONSE_MODEL_ATTRIBUTE = "gen_ai.response.model";
const GEN_AI_RESPONSE_ID_ATTRIBUTE = "gen_ai.response.id";
const GEN_AI_RESPONSE_STOP_REASON_ATTRIBUTE = "gen_ai.response.stop_reason";
const GEN_AI_USAGE_INPUT_TOKENS_ATTRIBUTE = "gen_ai.usage.input_tokens";
const GEN_AI_USAGE_OUTPUT_TOKENS_ATTRIBUTE = "gen_ai.usage.output_tokens";
const GEN_AI_USAGE_TOTAL_TOKENS_ATTRIBUTE = "gen_ai.usage.total_tokens";
const GEN_AI_OPERATION_NAME_ATTRIBUTE = "gen_ai.operation.name";
const GEN_AI_INPUT_MESSAGES_ORIGINAL_LENGTH_ATTRIBUTE = "sentry.sdk_meta.gen_ai.input.messages.original_length";
const GEN_AI_INPUT_MESSAGES_ATTRIBUTE = "gen_ai.input.messages";
const GEN_AI_SYSTEM_INSTRUCTIONS_ATTRIBUTE = "gen_ai.system_instructions";
const GEN_AI_RESPONSE_TEXT_ATTRIBUTE = "gen_ai.response.text";
const GEN_AI_REQUEST_AVAILABLE_TOOLS_ATTRIBUTE = "gen_ai.request.available_tools";
const GEN_AI_RESPONSE_STREAMING_ATTRIBUTE = "gen_ai.response.streaming";
const GEN_AI_RESPONSE_TOOL_CALLS_ATTRIBUTE = "gen_ai.response.tool_calls";
const GEN_AI_AGENT_NAME_ATTRIBUTE = "gen_ai.agent.name";
const GEN_AI_PIPELINE_NAME_ATTRIBUTE = "gen_ai.pipeline.name";
const GEN_AI_CONVERSATION_ID_ATTRIBUTE = "gen_ai.conversation.id";
const GEN_AI_USAGE_CACHE_CREATION_INPUT_TOKENS_ATTRIBUTE = "gen_ai.usage.cache_creation_input_tokens";
const GEN_AI_USAGE_CACHE_READ_INPUT_TOKENS_ATTRIBUTE = "gen_ai.usage.cache_read_input_tokens";
const GEN_AI_INVOKE_AGENT_OPERATION_ATTRIBUTE = "gen_ai.invoke_agent";
const GEN_AI_EMBEDDINGS_INPUT_ATTRIBUTE = "gen_ai.embeddings.input";
const GEN_AI_EMBEDDINGS_OPERATION_ATTRIBUTE = "gen_ai.embeddings";
const GEN_AI_EXECUTE_TOOL_OPERATION_ATTRIBUTE = "gen_ai.execute_tool";
const GEN_AI_TOOL_NAME_ATTRIBUTE = "gen_ai.tool.name";
const GEN_AI_TOOL_CALL_ID_ATTRIBUTE = "gen_ai.tool.call.id";
const GEN_AI_TOOL_TYPE_ATTRIBUTE = "gen_ai.tool.type";
const GEN_AI_TOOL_INPUT_ATTRIBUTE = "gen_ai.tool.input";
const GEN_AI_TOOL_OUTPUT_ATTRIBUTE = "gen_ai.tool.output";
const GEN_AI_TOOL_DESCRIPTION_ATTRIBUTE = "gen_ai.tool.description";
function isContentMedia(part) {
  if (!part || typeof part !== "object") return false;
  return isContentMediaSource(part) || hasInlineData(part) || hasImageUrl(part) || hasInputAudio(part) || hasFileData(part) || hasMediaTypeData(part) || hasVercelFileData(part) || hasVercelImageData(part) || hasBlobOrBase64Type(part) || hasB64Json(part) || hasImageGenerationResult(part) || hasDataUri(part);
}
function hasImageUrl(part) {
  if (!("image_url" in part)) return false;
  if (typeof part.image_url === "string") return part.image_url.startsWith("data:");
  return hasNestedImageUrl(part);
}
function hasNestedImageUrl(part) {
  return "image_url" in part && !!part.image_url && typeof part.image_url === "object" && "url" in part.image_url && typeof part.image_url.url === "string" && part.image_url.url.startsWith("data:");
}
function isContentMediaSource(part) {
  return "type" in part && typeof part.type === "string" && "source" in part && isContentMedia(part.source);
}
function hasInlineData(part) {
  return "inlineData" in part && !!part.inlineData && typeof part.inlineData === "object" && "data" in part.inlineData && typeof part.inlineData.data === "string";
}
function hasInputAudio(part) {
  return "type" in part && part.type === "input_audio" && "input_audio" in part && !!part.input_audio && typeof part.input_audio === "object" && "data" in part.input_audio && typeof part.input_audio.data === "string";
}
function hasFileData(part) {
  return "type" in part && part.type === "file" && "file" in part && !!part.file && typeof part.file === "object" && "file_data" in part.file && typeof part.file.file_data === "string";
}
function hasMediaTypeData(part) {
  return "media_type" in part && typeof part.media_type === "string" && "data" in part;
}
function hasVercelFileData(part) {
  return "type" in part && part.type === "file" && "mediaType" in part && typeof part.mediaType === "string" && "data" in part && typeof part.data === "string" && // Only strip base64/binary data, not HTTP/HTTPS URLs which should be preserved as references
  !part.data.startsWith("http://") && !part.data.startsWith("https://");
}
function hasVercelImageData(part) {
  return "type" in part && part.type === "image" && "image" in part && typeof part.image === "string" && // Only strip base64/data URIs, not HTTP/HTTPS URLs which should be preserved as references
  !part.image.startsWith("http://") && !part.image.startsWith("https://");
}
function hasBlobOrBase64Type(part) {
  return "type" in part && (part.type === "blob" || part.type === "base64");
}
function hasB64Json(part) {
  return "b64_json" in part;
}
function hasImageGenerationResult(part) {
  return "type" in part && "result" in part && part.type === "image_generation";
}
function hasDataUri(part) {
  return "uri" in part && typeof part.uri === "string" && part.uri.startsWith("data:");
}
const REMOVED_STRING = "[Blob substitute]";
const MEDIA_FIELDS = ["image_url", "data", "content", "b64_json", "result", "uri", "image"];
function stripInlineMediaFromSingleMessage(part) {
  const strip = { ...part };
  if (isContentMedia(strip.source)) {
    strip.source = stripInlineMediaFromSingleMessage(strip.source);
  }
  if (hasInlineData(part)) {
    strip.inlineData = { ...part.inlineData, data: REMOVED_STRING };
  }
  if (hasNestedImageUrl(part)) {
    strip.image_url = { ...part.image_url, url: REMOVED_STRING };
  }
  if (hasInputAudio(part)) {
    strip.input_audio = { ...part.input_audio, data: REMOVED_STRING };
  }
  if (hasFileData(part)) {
    strip.file = { ...part.file, file_data: REMOVED_STRING };
  }
  for (const field of MEDIA_FIELDS) {
    if (typeof strip[field] === "string") strip[field] = REMOVED_STRING;
  }
  return strip;
}
const DEFAULT_GEN_AI_MESSAGES_BYTE_LIMIT = 2e4;
const utf8Bytes = (text) => {
  return new TextEncoder().encode(text).length;
};
const jsonBytes = (value) => {
  return utf8Bytes(JSON.stringify(value));
};
function truncateTextByBytes(text, maxBytes) {
  if (utf8Bytes(text) <= maxBytes) {
    return text;
  }
  let low = 0;
  let high = text.length;
  let bestFit = "";
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = text.slice(0, mid);
    const byteSize = utf8Bytes(candidate);
    if (byteSize <= maxBytes) {
      bestFit = candidate;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return bestFit;
}
function getItemText(item) {
  if (typeof item === "string") {
    return item;
  }
  if ("text" in item && typeof item.text === "string") {
    return item.text;
  }
  return "";
}
function withItemText(item, text) {
  if (typeof item === "string") {
    return text;
  }
  return { ...item, text };
}
function isContentMessage(message) {
  return message !== null && typeof message === "object" && "content" in message && typeof message.content === "string";
}
function isContentArrayMessage(message) {
  return message !== null && typeof message === "object" && "content" in message && Array.isArray(message.content);
}
function isPartsMessage(message) {
  return message !== null && typeof message === "object" && "parts" in message && Array.isArray(message.parts) && message.parts.length > 0;
}
function truncateContentMessage(message, maxBytes) {
  const emptyMessage = { ...message, content: "" };
  const overhead = jsonBytes(emptyMessage);
  const availableForContent = maxBytes - overhead;
  if (availableForContent <= 0) {
    return [];
  }
  const truncatedContent = truncateTextByBytes(message.content, availableForContent);
  return [{ ...message, content: truncatedContent }];
}
function getArrayItems(message) {
  if ("parts" in message && Array.isArray(message.parts)) {
    return { key: "parts", items: message.parts };
  }
  if ("content" in message && Array.isArray(message.content)) {
    return { key: "content", items: message.content };
  }
  return { key: null, items: [] };
}
function truncateArrayMessage(message, maxBytes) {
  const { key, items } = getArrayItems(message);
  if (key === null || items.length === 0) {
    return [];
  }
  const emptyItems = items.map((item) => withItemText(item, ""));
  const overhead = jsonBytes({ ...message, [key]: emptyItems });
  let remainingBytes = maxBytes - overhead;
  if (remainingBytes <= 0) {
    return [];
  }
  const includedItems = [];
  for (const item of items) {
    const text = getItemText(item);
    const textSize = utf8Bytes(text);
    if (textSize <= remainingBytes) {
      includedItems.push(item);
      remainingBytes -= textSize;
    } else if (includedItems.length === 0) {
      const truncated = truncateTextByBytes(text, remainingBytes);
      if (truncated) {
        includedItems.push(withItemText(item, truncated));
      }
      break;
    } else {
      break;
    }
  }
  if (includedItems.length <= 0) {
    return [];
  } else {
    return [{ ...message, [key]: includedItems }];
  }
}
function truncateSingleMessage(message, maxBytes) {
  if (!message) return [];
  if (typeof message === "string") {
    const truncated = truncateTextByBytes(message, maxBytes);
    return truncated ? [truncated] : [];
  }
  if (typeof message !== "object") {
    return [];
  }
  if (isContentMessage(message)) {
    return truncateContentMessage(message, maxBytes);
  }
  if (isContentArrayMessage(message) || isPartsMessage(message)) {
    return truncateArrayMessage(message, maxBytes);
  }
  return [];
}
function stripInlineMediaFromMessages(messages) {
  const stripped = messages.map((message) => {
    let newMessage = void 0;
    if (!!message && typeof message === "object") {
      if (isContentArrayMessage(message)) {
        newMessage = {
          ...message,
          content: stripInlineMediaFromMessages(message.content)
        };
      } else if ("content" in message && isContentMedia(message.content)) {
        newMessage = {
          ...message,
          content: stripInlineMediaFromSingleMessage(message.content)
        };
      }
      if (isPartsMessage(message)) {
        newMessage = {
          // might have to strip content AND parts
          ...newMessage ?? message,
          parts: stripInlineMediaFromMessages(message.parts)
        };
      }
      if (isContentMedia(newMessage)) {
        newMessage = stripInlineMediaFromSingleMessage(newMessage);
      } else if (isContentMedia(message)) {
        newMessage = stripInlineMediaFromSingleMessage(message);
      }
    }
    return newMessage ?? message;
  });
  return stripped;
}
function truncateMessagesByBytes(messages, maxBytes) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return messages;
  }
  const effectiveMaxBytes = maxBytes - 2;
  const lastMessage = messages[messages.length - 1];
  const stripped = stripInlineMediaFromMessages([lastMessage]);
  const strippedMessage = stripped[0];
  const messageBytes = jsonBytes(strippedMessage);
  if (messageBytes <= effectiveMaxBytes) {
    return stripped;
  }
  return truncateSingleMessage(strippedMessage, effectiveMaxBytes);
}
function truncateGenAiMessages(messages) {
  return truncateMessagesByBytes(messages, DEFAULT_GEN_AI_MESSAGES_BYTE_LIMIT);
}
function truncateGenAiStringInput(input) {
  return truncateTextByBytes(input, DEFAULT_GEN_AI_MESSAGES_BYTE_LIMIT);
}
function resolveAIRecordingOptions(options) {
  const genAI = getClient()?.getDataCollectionOptions().genAI;
  return {
    ...options,
    recordInputs: options?.recordInputs ?? genAI?.inputs ?? false,
    recordOutputs: options?.recordOutputs ?? genAI?.outputs ?? false
  };
}
function shouldEnableTruncation(enableTruncation) {
  const client = getClient();
  return enableTruncation ?? !(client && hasSpanStreamingEnabled(client));
}
function buildMethodPath(currentPath, prop) {
  return currentPath ? `${currentPath}.${prop}` : prop;
}
function setTokenUsageAttributes(span, promptTokens, completionTokens, cachedInputTokens, cachedOutputTokens) {
  if (promptTokens !== void 0) {
    span.setAttributes({
      [GEN_AI_USAGE_INPUT_TOKENS_ATTRIBUTE]: promptTokens
    });
  }
  if (completionTokens !== void 0) {
    span.setAttributes({
      [GEN_AI_USAGE_OUTPUT_TOKENS_ATTRIBUTE]: completionTokens
    });
  }
  if (promptTokens !== void 0 || completionTokens !== void 0 || cachedInputTokens !== void 0 || cachedOutputTokens !== void 0) {
    const totalTokens = (promptTokens ?? 0) + (completionTokens ?? 0) + (cachedInputTokens ?? 0) + (cachedOutputTokens ?? 0);
    span.setAttributes({
      [GEN_AI_USAGE_TOTAL_TOKENS_ATTRIBUTE]: totalTokens
    });
  }
}
function endStreamSpan(span, state, recordOutputs) {
  if (!span.isRecording()) {
    return;
  }
  const attrs = {
    [GEN_AI_RESPONSE_STREAMING_ATTRIBUTE]: true
  };
  if (state.responseId) attrs[GEN_AI_RESPONSE_ID_ATTRIBUTE] = state.responseId;
  if (state.responseModel) attrs[GEN_AI_RESPONSE_MODEL_ATTRIBUTE] = state.responseModel;
  if (state.promptTokens !== void 0) attrs[GEN_AI_USAGE_INPUT_TOKENS_ATTRIBUTE] = state.promptTokens;
  if (state.completionTokens !== void 0) attrs[GEN_AI_USAGE_OUTPUT_TOKENS_ATTRIBUTE] = state.completionTokens;
  if (state.totalTokens !== void 0) {
    attrs[GEN_AI_USAGE_TOTAL_TOKENS_ATTRIBUTE] = state.totalTokens;
  } else if (state.promptTokens !== void 0 || state.completionTokens !== void 0 || state.cacheCreationInputTokens !== void 0 || state.cacheReadInputTokens !== void 0) {
    attrs[GEN_AI_USAGE_TOTAL_TOKENS_ATTRIBUTE] = (state.promptTokens ?? 0) + (state.completionTokens ?? 0) + (state.cacheCreationInputTokens ?? 0) + (state.cacheReadInputTokens ?? 0);
  }
  if (state.finishReasons.length) {
    attrs[GEN_AI_RESPONSE_FINISH_REASONS_ATTRIBUTE] = JSON.stringify(state.finishReasons);
  }
  if (recordOutputs && state.responseTexts.length) {
    attrs[GEN_AI_RESPONSE_TEXT_ATTRIBUTE] = state.responseTexts.join("");
  }
  if (recordOutputs && state.toolCalls.length) {
    attrs[GEN_AI_RESPONSE_TOOL_CALLS_ATTRIBUTE] = JSON.stringify(state.toolCalls);
  }
  span.setAttributes(attrs);
  span.end();
}
function getJsonString(value) {
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
}
function getTruncatedJsonString(value) {
  if (typeof value === "string") {
    return truncateGenAiStringInput(value);
  }
  if (Array.isArray(value)) {
    const truncatedMessages = truncateGenAiMessages(value);
    return JSON.stringify(truncatedMessages);
  }
  return JSON.stringify(value);
}
function extractSystemInstructions(messages) {
  if (!Array.isArray(messages)) {
    return { systemInstructions: void 0, filteredMessages: messages };
  }
  const systemMessageIndex = messages.findIndex(
    (msg) => msg && typeof msg === "object" && "role" in msg && msg.role === "system"
  );
  if (systemMessageIndex === -1) {
    return { systemInstructions: void 0, filteredMessages: messages };
  }
  const systemMessage = messages[systemMessageIndex];
  const systemContent = typeof systemMessage.content === "string" ? systemMessage.content : systemMessage.content !== void 0 ? JSON.stringify(systemMessage.content) : void 0;
  if (!systemContent) {
    return { systemInstructions: void 0, filteredMessages: messages };
  }
  const systemInstructions = JSON.stringify([{ type: "text", content: systemContent }]);
  const filteredMessages = [...messages.slice(0, systemMessageIndex), ...messages.slice(systemMessageIndex + 1)];
  return { systemInstructions, filteredMessages };
}
async function createWithResponseWrapper(originalWithResponse, instrumentedPromise, mechanismType) {
  const safeOriginalWithResponse = originalWithResponse.catch((error2) => {
    captureException(error2, {
      mechanism: {
        handled: false,
        type: mechanismType
      }
    });
    throw error2;
  });
  const instrumentedResult = await instrumentedPromise;
  const originalWrapper = await safeOriginalWithResponse;
  if (originalWrapper && typeof originalWrapper === "object" && "data" in originalWrapper) {
    return {
      ...originalWrapper,
      data: instrumentedResult
    };
  }
  return instrumentedResult;
}
function wrapPromiseWithMethods(originalPromiseLike, instrumentedPromise, mechanismType) {
  if (!isThenable(originalPromiseLike)) {
    return instrumentedPromise;
  }
  return new Proxy(originalPromiseLike, {
    get(target, prop) {
      const useInstrumentedPromise = prop in Promise.prototype || prop === Symbol.toStringTag;
      const source = useInstrumentedPromise ? instrumentedPromise : target;
      const value = Reflect.get(source, prop);
      if (prop === "withResponse" && typeof value === "function") {
        return function wrappedWithResponse() {
          const originalWithResponse = value.call(target);
          return createWithResponseWrapper(originalWithResponse, instrumentedPromise, mechanismType);
        };
      }
      return typeof value === "function" ? value.bind(source) : value;
    }
  });
}
const OPENAI_METHOD_REGISTRY = {
  "responses.create": { operation: "chat" },
  "chat.completions.create": { operation: "chat" },
  "embeddings.create": { operation: "embeddings" },
  // Conversations API - for conversation state management
  // https://platform.openai.com/docs/guides/conversation-state
  "conversations.create": { operation: "chat" }
};
const RESPONSES_TOOL_CALL_EVENT_TYPES = [
  "response.output_item.added",
  "response.function_call_arguments.delta",
  "response.function_call_arguments.done",
  "response.output_item.done"
];
const RESPONSE_EVENT_TYPES = [
  "response.created",
  "response.in_progress",
  "response.failed",
  "response.completed",
  "response.incomplete",
  "response.queued",
  "response.output_text.delta",
  ...RESPONSES_TOOL_CALL_EVENT_TYPES
];
function isResponsesApiStreamEvent(event) {
  return event !== null && typeof event === "object" && "type" in event && typeof event.type === "string" && event.type.startsWith("response.");
}
function isChatCompletionChunk(event) {
  return event !== null && typeof event === "object" && "object" in event && event.object === "chat.completion.chunk";
}
function addResponseAttributes$2(span, result, recordOutputs) {
  if (!result || typeof result !== "object") return;
  const response = result;
  const attrs = {};
  if (typeof response.id === "string") {
    attrs[GEN_AI_RESPONSE_ID_ATTRIBUTE] = response.id;
  }
  if (typeof response.model === "string") {
    attrs[GEN_AI_RESPONSE_MODEL_ATTRIBUTE] = response.model;
  }
  if (response.object === "conversation" && typeof response.id === "string") {
    attrs[GEN_AI_CONVERSATION_ID_ATTRIBUTE] = response.id;
  }
  if (response.usage && typeof response.usage === "object") {
    const usage = response.usage;
    const inputTokens = usage.prompt_tokens ?? usage.input_tokens;
    if (typeof inputTokens === "number") {
      attrs[GEN_AI_USAGE_INPUT_TOKENS_ATTRIBUTE] = inputTokens;
    }
    const outputTokens = usage.completion_tokens ?? usage.output_tokens;
    if (typeof outputTokens === "number") {
      attrs[GEN_AI_USAGE_OUTPUT_TOKENS_ATTRIBUTE] = outputTokens;
    }
    if (typeof usage.total_tokens === "number") {
      attrs[GEN_AI_USAGE_TOTAL_TOKENS_ATTRIBUTE] = usage.total_tokens;
    }
  }
  if (Array.isArray(response.choices)) {
    const choices = response.choices;
    const finishReasons = choices.map((choice) => choice.finish_reason).filter((reason) => typeof reason === "string");
    if (finishReasons.length > 0) {
      attrs[GEN_AI_RESPONSE_FINISH_REASONS_ATTRIBUTE] = JSON.stringify(finishReasons);
    }
    if (recordOutputs) {
      const responseTexts = choices.map((choice) => {
        const message = choice.message;
        return message?.content || "";
      });
      attrs[GEN_AI_RESPONSE_TEXT_ATTRIBUTE] = JSON.stringify(responseTexts);
      const toolCalls = choices.map((choice) => {
        const message = choice.message;
        return message?.tool_calls;
      }).filter((calls) => Array.isArray(calls) && calls.length > 0).flat();
      if (toolCalls.length > 0) {
        attrs[GEN_AI_RESPONSE_TOOL_CALLS_ATTRIBUTE] = JSON.stringify(toolCalls);
      }
    }
  }
  if (typeof response.status === "string") {
    if (!attrs[GEN_AI_RESPONSE_FINISH_REASONS_ATTRIBUTE]) {
      attrs[GEN_AI_RESPONSE_FINISH_REASONS_ATTRIBUTE] = JSON.stringify([response.status]);
    }
  }
  if (recordOutputs) {
    if (typeof response.output_text === "string" && !attrs[GEN_AI_RESPONSE_TEXT_ATTRIBUTE]) {
      attrs[GEN_AI_RESPONSE_TEXT_ATTRIBUTE] = response.output_text;
    }
    if (Array.isArray(response.output) && response.output.length > 0 && !attrs[GEN_AI_RESPONSE_TOOL_CALLS_ATTRIBUTE]) {
      const functionCalls = response.output.filter(
        (item) => item?.type === "function_call"
      );
      if (functionCalls.length > 0) {
        attrs[GEN_AI_RESPONSE_TOOL_CALLS_ATTRIBUTE] = JSON.stringify(functionCalls);
      }
    }
  }
  span.setAttributes(attrs);
}
function extractConversationId(params) {
  if ("conversation" in params && typeof params.conversation === "string") {
    return params.conversation;
  }
  if ("previous_response_id" in params && typeof params.previous_response_id === "string") {
    return params.previous_response_id;
  }
  return void 0;
}
function extractRequestParameters(params) {
  const attributes = {
    [GEN_AI_REQUEST_MODEL_ATTRIBUTE]: params.model ?? "unknown"
  };
  if ("temperature" in params) attributes[GEN_AI_REQUEST_TEMPERATURE_ATTRIBUTE] = params.temperature;
  if ("top_p" in params) attributes[GEN_AI_REQUEST_TOP_P_ATTRIBUTE] = params.top_p;
  if ("frequency_penalty" in params) attributes[GEN_AI_REQUEST_FREQUENCY_PENALTY_ATTRIBUTE] = params.frequency_penalty;
  if ("presence_penalty" in params) attributes[GEN_AI_REQUEST_PRESENCE_PENALTY_ATTRIBUTE] = params.presence_penalty;
  if ("stream" in params) attributes[GEN_AI_REQUEST_STREAM_ATTRIBUTE] = params.stream;
  if ("encoding_format" in params) attributes[GEN_AI_REQUEST_ENCODING_FORMAT_ATTRIBUTE] = params.encoding_format;
  if ("dimensions" in params) attributes[GEN_AI_REQUEST_DIMENSIONS_ATTRIBUTE] = params.dimensions;
  const conversationId = extractConversationId(params);
  if (conversationId) {
    attributes[GEN_AI_CONVERSATION_ID_ATTRIBUTE] = conversationId;
  }
  return attributes;
}
function processChatCompletionToolCalls(toolCalls, state) {
  for (const toolCall of toolCalls) {
    const index = toolCall.index;
    if (index === void 0 || !toolCall.function) continue;
    if (!(index in state.chatCompletionToolCalls)) {
      state.chatCompletionToolCalls[index] = {
        ...toolCall,
        function: {
          name: toolCall.function.name,
          arguments: toolCall.function.arguments || ""
        }
      };
    } else {
      const existingToolCall = state.chatCompletionToolCalls[index];
      if (toolCall.function.arguments && existingToolCall?.function) {
        existingToolCall.function.arguments += toolCall.function.arguments;
      }
    }
  }
}
function processChatCompletionChunk(chunk, state, recordOutputs) {
  state.responseId = chunk.id ?? state.responseId;
  state.responseModel = chunk.model ?? state.responseModel;
  if (chunk.usage) {
    state.promptTokens = chunk.usage.prompt_tokens;
    state.completionTokens = chunk.usage.completion_tokens;
    state.totalTokens = chunk.usage.total_tokens;
  }
  for (const choice of chunk.choices ?? []) {
    if (recordOutputs) {
      if (choice.delta?.content) {
        state.responseTexts.push(choice.delta.content);
      }
      if (choice.delta?.tool_calls) {
        processChatCompletionToolCalls(choice.delta.tool_calls, state);
      }
    }
    if (choice.finish_reason) {
      state.finishReasons.push(choice.finish_reason);
    }
  }
}
function processResponsesApiEvent(streamEvent, state, recordOutputs, span) {
  if (!(streamEvent && typeof streamEvent === "object")) {
    state.eventTypes.push("unknown:non-object");
    return;
  }
  if (streamEvent instanceof Error) {
    span.setStatus({ code: SPAN_STATUS_ERROR, message: "internal_error" });
    captureException(streamEvent, {
      mechanism: {
        handled: false,
        type: "auto.ai.openai.stream-response"
      }
    });
    return;
  }
  if (!("type" in streamEvent)) return;
  const event = streamEvent;
  if (!RESPONSE_EVENT_TYPES.includes(event.type)) {
    state.eventTypes.push(event.type);
    return;
  }
  if (recordOutputs) {
    if (event.type === "response.output_item.done" && "item" in event) {
      state.responsesApiToolCalls.push(event.item);
    }
    if (event.type === "response.output_text.delta" && "delta" in event && event.delta) {
      state.responseTexts.push(event.delta);
      return;
    }
  }
  if ("response" in event) {
    const { response } = event;
    state.responseId = response.id ?? state.responseId;
    state.responseModel = response.model ?? state.responseModel;
    if (response.usage) {
      state.promptTokens = response.usage.input_tokens;
      state.completionTokens = response.usage.output_tokens;
      state.totalTokens = response.usage.total_tokens;
    }
    if (response.status) {
      state.finishReasons.push(response.status);
    }
    if (recordOutputs && response.output_text) {
      state.responseTexts.push(response.output_text);
    }
  }
}
async function* instrumentStream$1(stream, span, recordOutputs) {
  const state = {
    eventTypes: [],
    responseTexts: [],
    finishReasons: [],
    responseId: "",
    responseModel: "",
    promptTokens: void 0,
    completionTokens: void 0,
    totalTokens: void 0,
    chatCompletionToolCalls: {},
    responsesApiToolCalls: []
  };
  try {
    for await (const event of stream) {
      if (isChatCompletionChunk(event)) {
        processChatCompletionChunk(event, state, recordOutputs);
      } else if (isResponsesApiStreamEvent(event)) {
        processResponsesApiEvent(event, state, recordOutputs, span);
      }
      yield event;
    }
  } finally {
    const allToolCalls = [...Object.values(state.chatCompletionToolCalls), ...state.responsesApiToolCalls];
    endStreamSpan(span, { ...state, toolCalls: allToolCalls }, recordOutputs);
  }
}
function extractAvailableTools(params) {
  const tools = Array.isArray(params.tools) ? params.tools : [];
  const hasWebSearchOptions = params.web_search_options && typeof params.web_search_options === "object";
  const webSearchOptions = hasWebSearchOptions ? [{ type: "web_search_options", ...params.web_search_options }] : [];
  const availableTools = [...tools, ...webSearchOptions];
  if (availableTools.length === 0) {
    return void 0;
  }
  try {
    return JSON.stringify(availableTools);
  } catch (error2) {
    DEBUG_BUILD$5 && debug$2.error("Failed to serialize OpenAI tools:", error2);
    return void 0;
  }
}
function extractRequestAttributes$2(args, operationName) {
  const attributes = {
    [GEN_AI_SYSTEM_ATTRIBUTE]: "openai",
    [GEN_AI_OPERATION_NAME_ATTRIBUTE]: operationName,
    [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ai.openai"
  };
  if (args.length > 0 && typeof args[0] === "object" && args[0] !== null) {
    const params = args[0];
    const availableTools = extractAvailableTools(params);
    if (availableTools) {
      attributes[GEN_AI_REQUEST_AVAILABLE_TOOLS_ATTRIBUTE] = availableTools;
    }
    Object.assign(attributes, extractRequestParameters(params));
  } else {
    attributes[GEN_AI_REQUEST_MODEL_ATTRIBUTE] = "unknown";
  }
  return attributes;
}
function addRequestAttributes(span, params, operationName, enableTruncation) {
  if (operationName === "embeddings" && "input" in params) {
    const input = params.input;
    if (input == null) {
      return;
    }
    if (typeof input === "string" && input.length === 0) {
      return;
    }
    if (Array.isArray(input) && input.length === 0) {
      return;
    }
    span.setAttribute(GEN_AI_EMBEDDINGS_INPUT_ATTRIBUTE, typeof input === "string" ? input : JSON.stringify(input));
    return;
  }
  const src = "input" in params ? params.input : "messages" in params ? params.messages : void 0;
  if (!src) {
    return;
  }
  if (Array.isArray(src) && src.length === 0) {
    return;
  }
  const { systemInstructions, filteredMessages } = extractSystemInstructions(src);
  if (systemInstructions) {
    span.setAttribute(GEN_AI_SYSTEM_INSTRUCTIONS_ATTRIBUTE, systemInstructions);
  }
  span.setAttribute(
    GEN_AI_INPUT_MESSAGES_ATTRIBUTE,
    enableTruncation ? getTruncatedJsonString(filteredMessages) : getJsonString(filteredMessages)
  );
  if (Array.isArray(filteredMessages)) {
    span.setAttribute(GEN_AI_INPUT_MESSAGES_ORIGINAL_LENGTH_ATTRIBUTE, filteredMessages.length);
  } else {
    span.setAttribute(GEN_AI_INPUT_MESSAGES_ORIGINAL_LENGTH_ATTRIBUTE, 1);
  }
}
function instrumentMethod$2(originalMethod, methodPath, instrumentedMethod, context, options) {
  return function instrumentedCall(...args) {
    const operationName = instrumentedMethod.operation || "unknown";
    const requestAttributes = extractRequestAttributes$2(args, operationName);
    const model = requestAttributes[GEN_AI_REQUEST_MODEL_ATTRIBUTE] || "unknown";
    const params = args[0];
    const isStreamRequested = params && typeof params === "object" && params.stream === true;
    const spanConfig = {
      name: `${operationName} ${model}`,
      op: `gen_ai.${operationName}`,
      attributes: requestAttributes
    };
    if (isStreamRequested) {
      let originalResult2;
      const instrumentedPromise2 = startSpanManual(spanConfig, (span) => {
        originalResult2 = originalMethod.apply(context, args);
        if (options.recordInputs && params) {
          addRequestAttributes(span, params, operationName, shouldEnableTruncation(options.enableTruncation));
        }
        return (async () => {
          try {
            const result = await originalResult2;
            return instrumentStream$1(
              result,
              span,
              options.recordOutputs ?? false
            );
          } catch (error2) {
            span.setStatus({ code: SPAN_STATUS_ERROR, message: "internal_error" });
            captureException(error2, {
              mechanism: {
                handled: false,
                type: "auto.ai.openai.stream",
                data: { function: methodPath }
              }
            });
            span.end();
            throw error2;
          }
        })();
      });
      return wrapPromiseWithMethods(originalResult2, instrumentedPromise2, "auto.ai.openai");
    }
    let originalResult;
    const instrumentedPromise = startSpan(spanConfig, (span) => {
      originalResult = originalMethod.apply(context, args);
      if (options.recordInputs && params) {
        addRequestAttributes(span, params, operationName, shouldEnableTruncation(options.enableTruncation));
      }
      return originalResult.then(
        (result) => {
          addResponseAttributes$2(span, result, options.recordOutputs);
          return result;
        },
        (error2) => {
          captureException(error2, {
            mechanism: {
              handled: false,
              type: "auto.ai.openai",
              data: { function: methodPath }
            }
          });
          throw error2;
        }
      );
    });
    return wrapPromiseWithMethods(originalResult, instrumentedPromise, "auto.ai.openai");
  };
}
function createDeepProxy$2(target, currentPath = "", options) {
  return new Proxy(target, {
    get(obj, prop) {
      const value = obj[prop];
      const methodPath = buildMethodPath(currentPath, String(prop));
      const instrumentedMethod = OPENAI_METHOD_REGISTRY[methodPath];
      if (typeof value === "function" && instrumentedMethod) {
        return instrumentMethod$2(
          value,
          methodPath,
          instrumentedMethod,
          obj,
          options
        );
      }
      if (typeof value === "function") {
        return value.bind(obj);
      }
      if (value && typeof value === "object") {
        return createDeepProxy$2(value, methodPath, options);
      }
      return value;
    }
  });
}
function instrumentOpenAiClient(client, options) {
  return createDeepProxy$2(client, "", resolveAIRecordingOptions(options));
}
const ANTHROPIC_METHOD_REGISTRY = {
  "messages.create": { operation: "chat" },
  "messages.stream": { operation: "chat", streaming: true },
  "messages.countTokens": { operation: "chat" },
  "models.get": { operation: "models" },
  "completions.create": { operation: "chat" },
  "models.retrieve": { operation: "models" },
  "beta.messages.create": { operation: "chat" }
};
function setMessagesAttribute(span, messages, enableTruncation) {
  if (Array.isArray(messages) && messages.length === 0) {
    return;
  }
  const { systemInstructions, filteredMessages } = extractSystemInstructions(messages);
  if (systemInstructions) {
    span.setAttributes({
      [GEN_AI_SYSTEM_INSTRUCTIONS_ATTRIBUTE]: systemInstructions
    });
  }
  const filteredLength = Array.isArray(filteredMessages) ? filteredMessages.length : 1;
  span.setAttributes({
    [GEN_AI_INPUT_MESSAGES_ATTRIBUTE]: enableTruncation ? getTruncatedJsonString(filteredMessages) : getJsonString(filteredMessages),
    [GEN_AI_INPUT_MESSAGES_ORIGINAL_LENGTH_ATTRIBUTE]: filteredLength
  });
}
const ANTHROPIC_ERROR_TYPE_TO_SPAN_STATUS = {
  invalid_request_error: "invalid_argument",
  authentication_error: "unauthenticated",
  permission_error: "permission_denied",
  not_found_error: "not_found",
  request_too_large: "failed_precondition",
  rate_limit_error: "resource_exhausted",
  api_error: "internal_error",
  overloaded_error: "unavailable"
};
function mapAnthropicErrorToStatusMessage(errorType) {
  if (!errorType) {
    return "internal_error";
  }
  return ANTHROPIC_ERROR_TYPE_TO_SPAN_STATUS[errorType] || "internal_error";
}
function handleResponseError(span, response) {
  if (response.error) {
    span.setStatus({ code: SPAN_STATUS_ERROR, message: mapAnthropicErrorToStatusMessage(response.error.type) });
    captureException(response.error, {
      mechanism: {
        handled: false,
        type: "auto.ai.anthropic.anthropic_error"
      }
    });
  }
}
function messagesFromParams(params) {
  const { system, messages, input } = params;
  const systemMessages = typeof system === "string" ? [{ role: "system", content: params.system }] : [];
  const inputParamMessages = Array.isArray(input) ? input : input != null ? [input] : void 0;
  const messagesParamMessages = Array.isArray(messages) ? messages : messages != null ? [messages] : [];
  const userMessages = inputParamMessages ?? messagesParamMessages;
  return [...systemMessages, ...userMessages];
}
function isErrorEvent$1(event, span) {
  if ("type" in event && typeof event.type === "string") {
    if (event.type === "error") {
      span.setStatus({ code: SPAN_STATUS_ERROR, message: mapAnthropicErrorToStatusMessage(event.error?.type) });
      captureException(event.error, {
        mechanism: {
          handled: false,
          type: "auto.ai.anthropic.anthropic_error"
        }
      });
      return true;
    }
  }
  return false;
}
function handleMessageMetadata(event, state) {
  if (event.type === "message_delta" && event.usage) {
    if ("output_tokens" in event.usage && typeof event.usage.output_tokens === "number") {
      state.completionTokens = event.usage.output_tokens;
    }
  }
  if (event.message) {
    const message = event.message;
    if (message.id) state.responseId = message.id;
    if (message.model) state.responseModel = message.model;
    if (message.stop_reason) state.finishReasons.push(message.stop_reason);
    if (message.usage) {
      if (typeof message.usage.input_tokens === "number") state.promptTokens = message.usage.input_tokens;
      if (typeof message.usage.cache_creation_input_tokens === "number")
        state.cacheCreationInputTokens = message.usage.cache_creation_input_tokens;
      if (typeof message.usage.cache_read_input_tokens === "number")
        state.cacheReadInputTokens = message.usage.cache_read_input_tokens;
    }
  }
}
function handleContentBlockStart(event, state) {
  if (event.type !== "content_block_start" || typeof event.index !== "number" || !event.content_block) return;
  if (event.content_block.type === "tool_use" || event.content_block.type === "server_tool_use") {
    state.activeToolBlocks[event.index] = {
      id: event.content_block.id,
      name: event.content_block.name,
      inputJsonParts: []
    };
  }
}
function handleContentBlockDelta(event, state, recordOutputs) {
  if (event.type !== "content_block_delta" || !event.delta) return;
  if (typeof event.index === "number" && "partial_json" in event.delta && typeof event.delta.partial_json === "string") {
    const active = state.activeToolBlocks[event.index];
    if (active) {
      active.inputJsonParts.push(event.delta.partial_json);
    }
  }
  if (recordOutputs && typeof event.delta.text === "string") {
    state.responseTexts.push(event.delta.text);
  }
}
function handleContentBlockStop(event, state) {
  if (event.type !== "content_block_stop" || typeof event.index !== "number") return;
  const active = state.activeToolBlocks[event.index];
  if (!active) return;
  const raw = active.inputJsonParts.join("");
  let parsedInput;
  try {
    parsedInput = raw ? JSON.parse(raw) : {};
  } catch {
    parsedInput = { __unparsed: raw };
  }
  state.toolCalls.push({
    type: "tool_use",
    id: active.id,
    name: active.name,
    input: parsedInput
  });
  delete state.activeToolBlocks[event.index];
}
function processEvent(event, state, recordOutputs, span) {
  if (!(event && typeof event === "object")) {
    return;
  }
  const isError2 = isErrorEvent$1(event, span);
  if (isError2) return;
  handleMessageMetadata(event, state);
  handleContentBlockStart(event, state);
  handleContentBlockDelta(event, state, recordOutputs);
  handleContentBlockStop(event, state);
}
async function* instrumentAsyncIterableStream(stream, span, recordOutputs) {
  const state = {
    responseTexts: [],
    finishReasons: [],
    responseId: "",
    responseModel: "",
    promptTokens: void 0,
    completionTokens: void 0,
    cacheCreationInputTokens: void 0,
    cacheReadInputTokens: void 0,
    toolCalls: [],
    activeToolBlocks: {}
  };
  try {
    for await (const event of stream) {
      processEvent(event, state, recordOutputs, span);
      yield event;
    }
  } finally {
    endStreamSpan(span, state, recordOutputs);
  }
}
function instrumentMessageStream(stream, span, recordOutputs) {
  const state = {
    responseTexts: [],
    finishReasons: [],
    responseId: "",
    responseModel: "",
    promptTokens: void 0,
    completionTokens: void 0,
    cacheCreationInputTokens: void 0,
    cacheReadInputTokens: void 0,
    toolCalls: [],
    activeToolBlocks: {}
  };
  stream.on("streamEvent", (event) => {
    processEvent(event, state, recordOutputs, span);
  });
  stream.on("message", () => {
    endStreamSpan(span, state, recordOutputs);
  });
  stream.on("error", (error2) => {
    captureException(error2, {
      mechanism: {
        handled: false,
        type: "auto.ai.anthropic.stream_error"
      }
    });
    if (span.isRecording()) {
      span.setStatus({ code: SPAN_STATUS_ERROR, message: "internal_error" });
      span.end();
    }
  });
  return stream;
}
function extractRequestAttributes$1(args, methodPath, operationName) {
  const attributes = {
    [GEN_AI_SYSTEM_ATTRIBUTE]: "anthropic",
    [GEN_AI_OPERATION_NAME_ATTRIBUTE]: operationName,
    [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ai.anthropic"
  };
  if (args.length > 0 && typeof args[0] === "object" && args[0] !== null) {
    const params = args[0];
    if (params.tools && Array.isArray(params.tools)) {
      attributes[GEN_AI_REQUEST_AVAILABLE_TOOLS_ATTRIBUTE] = JSON.stringify(params.tools);
    }
    attributes[GEN_AI_REQUEST_MODEL_ATTRIBUTE] = params.model ?? "unknown";
    if ("temperature" in params) attributes[GEN_AI_REQUEST_TEMPERATURE_ATTRIBUTE] = params.temperature;
    if ("top_p" in params) attributes[GEN_AI_REQUEST_TOP_P_ATTRIBUTE] = params.top_p;
    if ("stream" in params) attributes[GEN_AI_REQUEST_STREAM_ATTRIBUTE] = params.stream;
    if ("top_k" in params) attributes[GEN_AI_REQUEST_TOP_K_ATTRIBUTE] = params.top_k;
    if ("frequency_penalty" in params)
      attributes[GEN_AI_REQUEST_FREQUENCY_PENALTY_ATTRIBUTE] = params.frequency_penalty;
    if ("max_tokens" in params) attributes[GEN_AI_REQUEST_MAX_TOKENS_ATTRIBUTE] = params.max_tokens;
  } else {
    if (methodPath === "models.retrieve" || methodPath === "models.get") {
      attributes[GEN_AI_REQUEST_MODEL_ATTRIBUTE] = args[0];
    } else {
      attributes[GEN_AI_REQUEST_MODEL_ATTRIBUTE] = "unknown";
    }
  }
  return attributes;
}
function addPrivateRequestAttributes$1(span, params, enableTruncation) {
  const messages = messagesFromParams(params);
  setMessagesAttribute(span, messages, enableTruncation);
  if ("prompt" in params) {
    span.setAttributes({ [GEN_AI_PROMPT_ATTRIBUTE]: JSON.stringify(params.prompt) });
  }
}
function addContentAttributes(span, response) {
  if ("content" in response) {
    if (Array.isArray(response.content)) {
      span.setAttributes({
        [GEN_AI_RESPONSE_TEXT_ATTRIBUTE]: response.content.map((item) => item.text).filter((text) => !!text).join("")
      });
      const toolCalls = [];
      for (const item of response.content) {
        if (item.type === "tool_use" || item.type === "server_tool_use") {
          toolCalls.push(item);
        }
      }
      if (toolCalls.length > 0) {
        span.setAttributes({ [GEN_AI_RESPONSE_TOOL_CALLS_ATTRIBUTE]: JSON.stringify(toolCalls) });
      }
    }
  }
  if ("completion" in response) {
    span.setAttributes({ [GEN_AI_RESPONSE_TEXT_ATTRIBUTE]: response.completion });
  }
  if ("input_tokens" in response) {
    span.setAttributes({ [GEN_AI_RESPONSE_TEXT_ATTRIBUTE]: JSON.stringify(response.input_tokens) });
  }
}
function addMetadataAttributes(span, response) {
  if ("id" in response && "model" in response) {
    span.setAttributes({
      [GEN_AI_RESPONSE_ID_ATTRIBUTE]: response.id,
      [GEN_AI_RESPONSE_MODEL_ATTRIBUTE]: response.model
    });
    if ("usage" in response && response.usage) {
      setTokenUsageAttributes(
        span,
        response.usage.input_tokens,
        response.usage.output_tokens,
        response.usage.cache_creation_input_tokens,
        response.usage.cache_read_input_tokens
      );
    }
  }
}
function addResponseAttributes$1(span, response, recordOutputs) {
  if (!response || typeof response !== "object") return;
  if ("type" in response && response.type === "error") {
    handleResponseError(span, response);
    return;
  }
  if (recordOutputs) {
    addContentAttributes(span, response);
  }
  addMetadataAttributes(span, response);
}
function handleStreamingError(error2, span, methodPath) {
  captureException(error2, {
    mechanism: { handled: false, type: "auto.ai.anthropic", data: { function: methodPath } }
  });
  if (span.isRecording()) {
    span.setStatus({ code: SPAN_STATUS_ERROR, message: "internal_error" });
    span.end();
  }
  throw error2;
}
function handleStreamingRequest(originalMethod, target, context, args, requestAttributes, operationName, methodPath, params, options, isStreamRequested, isStreamingMethod) {
  const model = requestAttributes[GEN_AI_REQUEST_MODEL_ATTRIBUTE] ?? "unknown";
  const spanConfig = {
    name: `${operationName} ${model}`,
    op: `gen_ai.${operationName}`,
    attributes: requestAttributes
  };
  if (isStreamRequested && !isStreamingMethod) {
    let originalResult;
    const instrumentedPromise = startSpanManual(spanConfig, (span) => {
      originalResult = originalMethod.apply(context, args);
      if (options.recordInputs && params) {
        addPrivateRequestAttributes$1(span, params, shouldEnableTruncation(options.enableTruncation));
      }
      return (async () => {
        try {
          const result = await originalResult;
          return instrumentAsyncIterableStream(
            result,
            span,
            options.recordOutputs ?? false
          );
        } catch (error2) {
          return handleStreamingError(error2, span, methodPath);
        }
      })();
    });
    return wrapPromiseWithMethods(originalResult, instrumentedPromise, "auto.ai.anthropic");
  } else {
    return startSpanManual(spanConfig, (span) => {
      try {
        if (options.recordInputs && params) {
          addPrivateRequestAttributes$1(span, params, shouldEnableTruncation(options.enableTruncation));
        }
        const messageStream = target.apply(context, args);
        return instrumentMessageStream(messageStream, span, options.recordOutputs ?? false);
      } catch (error2) {
        return handleStreamingError(error2, span, methodPath);
      }
    });
  }
}
function instrumentMethod$1(originalMethod, methodPath, instrumentedMethod, context, options) {
  return new Proxy(originalMethod, {
    apply(target, thisArg, args) {
      const operationName = instrumentedMethod.operation || "unknown";
      const requestAttributes = extractRequestAttributes$1(args, methodPath, operationName);
      const model = requestAttributes[GEN_AI_REQUEST_MODEL_ATTRIBUTE] ?? "unknown";
      const params = typeof args[0] === "object" ? args[0] : void 0;
      const isStreamRequested = Boolean(params?.stream);
      const isStreamingMethod = instrumentedMethod.streaming === true;
      if (isStreamRequested || isStreamingMethod) {
        return handleStreamingRequest(
          originalMethod,
          target,
          context,
          args,
          requestAttributes,
          operationName,
          methodPath,
          params,
          options,
          isStreamRequested,
          isStreamingMethod
        );
      }
      let originalResult;
      const instrumentedPromise = startSpan(
        {
          name: `${operationName} ${model}`,
          op: `gen_ai.${operationName}`,
          attributes: requestAttributes
        },
        (span) => {
          originalResult = target.apply(context, args);
          if (options.recordInputs && params) {
            addPrivateRequestAttributes$1(span, params, shouldEnableTruncation(options.enableTruncation));
          }
          return originalResult.then(
            (result) => {
              addResponseAttributes$1(span, result, options.recordOutputs);
              return result;
            },
            (error2) => {
              captureException(error2, {
                mechanism: {
                  handled: false,
                  type: "auto.ai.anthropic",
                  data: {
                    function: methodPath
                  }
                }
              });
              throw error2;
            }
          );
        }
      );
      return wrapPromiseWithMethods(originalResult, instrumentedPromise, "auto.ai.anthropic");
    }
  });
}
function createDeepProxy$1(target, currentPath = "", options) {
  return new Proxy(target, {
    get(obj, prop) {
      const value = obj[prop];
      const methodPath = buildMethodPath(currentPath, String(prop));
      const instrumentedMethod = ANTHROPIC_METHOD_REGISTRY[methodPath];
      if (typeof value === "function" && instrumentedMethod) {
        return instrumentMethod$1(
          value,
          methodPath,
          instrumentedMethod,
          obj,
          options
        );
      }
      if (typeof value === "function") {
        return value.bind(obj);
      }
      if (value && typeof value === "object") {
        return createDeepProxy$1(value, methodPath, options);
      }
      return value;
    }
  });
}
function instrumentAnthropicAiClient(anthropicAiClient, options) {
  return createDeepProxy$1(anthropicAiClient, "", resolveAIRecordingOptions(options));
}
const GOOGLE_GENAI_METHOD_REGISTRY = {
  "models.generateContent": { operation: "generate_content" },
  "models.generateContentStream": { operation: "generate_content", streaming: true },
  "models.embedContent": { operation: "embeddings" },
  "chats.create": { proxyResultPath: "chat" },
  "chat.sendMessage": { operation: "chat" },
  "chat.sendMessageStream": { operation: "chat", streaming: true }
};
const GOOGLE_GENAI_SYSTEM_NAME = "google_genai";
function isErrorChunk(chunk, span) {
  const feedback = chunk?.promptFeedback;
  if (feedback?.blockReason) {
    const message = feedback.blockReasonMessage ?? feedback.blockReason;
    span.setStatus({ code: SPAN_STATUS_ERROR, message: "internal_error" });
    captureException(`Content blocked: ${message}`, {
      mechanism: { handled: false, type: "auto.ai.google_genai" }
    });
    return true;
  }
  return false;
}
function handleResponseMetadata(chunk, state) {
  if (typeof chunk.responseId === "string") state.responseId = chunk.responseId;
  if (typeof chunk.modelVersion === "string") state.responseModel = chunk.modelVersion;
  const usage = chunk.usageMetadata;
  if (usage) {
    if (typeof usage.promptTokenCount === "number") state.promptTokens = usage.promptTokenCount;
    if (typeof usage.candidatesTokenCount === "number") state.completionTokens = usage.candidatesTokenCount;
    if (typeof usage.totalTokenCount === "number") state.totalTokens = usage.totalTokenCount;
  }
}
function handleCandidateContent(chunk, state, recordOutputs) {
  if (Array.isArray(chunk.functionCalls)) {
    state.toolCalls.push(...chunk.functionCalls);
  }
  for (const candidate of chunk.candidates ?? []) {
    if (candidate?.finishReason && !state.finishReasons.includes(candidate.finishReason)) {
      state.finishReasons.push(candidate.finishReason);
    }
    for (const part of candidate?.content?.parts ?? []) {
      if (recordOutputs && part.text) state.responseTexts.push(part.text);
      if (part.functionCall) {
        state.toolCalls.push({
          type: "function",
          id: part.functionCall.id,
          name: part.functionCall.name,
          arguments: part.functionCall.args
        });
      }
    }
  }
}
function processChunk(chunk, state, recordOutputs, span) {
  if (!chunk || isErrorChunk(chunk, span)) return;
  handleResponseMetadata(chunk, state);
  handleCandidateContent(chunk, state, recordOutputs);
}
async function* instrumentStream(stream, span, recordOutputs) {
  const state = {
    responseTexts: [],
    finishReasons: [],
    toolCalls: []
  };
  try {
    for await (const chunk of stream) {
      processChunk(chunk, state, recordOutputs, span);
      yield chunk;
    }
  } finally {
    endStreamSpan(span, state, recordOutputs);
  }
}
function contentUnionToMessages(content, role = "user") {
  if (typeof content === "string") {
    return [{ role, content }];
  }
  if (Array.isArray(content)) {
    return content.flatMap((content2) => contentUnionToMessages(content2, role));
  }
  if (typeof content !== "object" || !content) return [];
  if ("role" in content && typeof content.role === "string") {
    return [content];
  }
  if ("parts" in content) {
    return [{ ...content, role }];
  }
  return [{ role, content }];
}
function extractModel(params, context) {
  if ("model" in params && typeof params.model === "string") {
    return params.model;
  }
  if (context && typeof context === "object") {
    const contextObj = context;
    if ("model" in contextObj && typeof contextObj.model === "string") {
      return contextObj.model;
    }
    if ("modelVersion" in contextObj && typeof contextObj.modelVersion === "string") {
      return contextObj.modelVersion;
    }
  }
  return "unknown";
}
function extractConfigAttributes(config) {
  const attributes = {};
  if ("temperature" in config && typeof config.temperature === "number") {
    attributes[GEN_AI_REQUEST_TEMPERATURE_ATTRIBUTE] = config.temperature;
  }
  if ("topP" in config && typeof config.topP === "number") {
    attributes[GEN_AI_REQUEST_TOP_P_ATTRIBUTE] = config.topP;
  }
  if ("topK" in config && typeof config.topK === "number") {
    attributes[GEN_AI_REQUEST_TOP_K_ATTRIBUTE] = config.topK;
  }
  if ("maxOutputTokens" in config && typeof config.maxOutputTokens === "number") {
    attributes[GEN_AI_REQUEST_MAX_TOKENS_ATTRIBUTE] = config.maxOutputTokens;
  }
  if ("frequencyPenalty" in config && typeof config.frequencyPenalty === "number") {
    attributes[GEN_AI_REQUEST_FREQUENCY_PENALTY_ATTRIBUTE] = config.frequencyPenalty;
  }
  if ("presencePenalty" in config && typeof config.presencePenalty === "number") {
    attributes[GEN_AI_REQUEST_PRESENCE_PENALTY_ATTRIBUTE] = config.presencePenalty;
  }
  return attributes;
}
function extractRequestAttributes(operationName, params, context) {
  const attributes = {
    [GEN_AI_SYSTEM_ATTRIBUTE]: GOOGLE_GENAI_SYSTEM_NAME,
    [GEN_AI_OPERATION_NAME_ATTRIBUTE]: operationName,
    [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ai.google_genai"
  };
  if (params) {
    attributes[GEN_AI_REQUEST_MODEL_ATTRIBUTE] = extractModel(params, context);
    if ("config" in params && typeof params.config === "object" && params.config) {
      const config = params.config;
      Object.assign(attributes, extractConfigAttributes(config));
      if ("tools" in config && Array.isArray(config.tools)) {
        const functionDeclarations = config.tools.flatMap(
          (tool) => tool.functionDeclarations
        );
        attributes[GEN_AI_REQUEST_AVAILABLE_TOOLS_ATTRIBUTE] = JSON.stringify(functionDeclarations);
      }
    }
  } else {
    attributes[GEN_AI_REQUEST_MODEL_ATTRIBUTE] = extractModel({}, context);
  }
  return attributes;
}
function addPrivateRequestAttributes(span, params, isEmbeddings, enableTruncation) {
  if (isEmbeddings) {
    const contents = params.contents;
    if (contents != null) {
      span.setAttribute(
        GEN_AI_EMBEDDINGS_INPUT_ATTRIBUTE,
        typeof contents === "string" ? contents : JSON.stringify(contents)
      );
    }
    return;
  }
  const messages = [];
  if ("config" in params && params.config && typeof params.config === "object" && "systemInstruction" in params.config && params.config.systemInstruction) {
    messages.push(...contentUnionToMessages(params.config.systemInstruction, "system"));
  }
  if ("history" in params) {
    messages.push(...contentUnionToMessages(params.history, "user"));
  }
  if ("contents" in params) {
    messages.push(...contentUnionToMessages(params.contents, "user"));
  }
  if ("message" in params) {
    messages.push(...contentUnionToMessages(params.message, "user"));
  }
  if (Array.isArray(messages) && messages.length) {
    const { systemInstructions, filteredMessages } = extractSystemInstructions(messages);
    if (systemInstructions) {
      span.setAttribute(GEN_AI_SYSTEM_INSTRUCTIONS_ATTRIBUTE, systemInstructions);
    }
    const filteredLength = Array.isArray(filteredMessages) ? filteredMessages.length : 0;
    span.setAttributes({
      [GEN_AI_INPUT_MESSAGES_ORIGINAL_LENGTH_ATTRIBUTE]: filteredLength,
      [GEN_AI_INPUT_MESSAGES_ATTRIBUTE]: enableTruncation ? getTruncatedJsonString(filteredMessages) : getJsonString(filteredMessages)
    });
  }
}
function addResponseAttributes(span, response, recordOutputs) {
  if (!response || typeof response !== "object") return;
  if (response.modelVersion) {
    span.setAttribute(GEN_AI_RESPONSE_MODEL_ATTRIBUTE, response.modelVersion);
  }
  if (response.usageMetadata && typeof response.usageMetadata === "object") {
    const usage = response.usageMetadata;
    if (typeof usage.promptTokenCount === "number") {
      span.setAttributes({
        [GEN_AI_USAGE_INPUT_TOKENS_ATTRIBUTE]: usage.promptTokenCount
      });
    }
    if (typeof usage.candidatesTokenCount === "number") {
      span.setAttributes({
        [GEN_AI_USAGE_OUTPUT_TOKENS_ATTRIBUTE]: usage.candidatesTokenCount
      });
    }
    if (typeof usage.totalTokenCount === "number") {
      span.setAttributes({
        [GEN_AI_USAGE_TOTAL_TOKENS_ATTRIBUTE]: usage.totalTokenCount
      });
    }
  }
  if (recordOutputs && Array.isArray(response.candidates) && response.candidates.length > 0) {
    const responseTexts = response.candidates.map((candidate) => {
      if (candidate.content?.parts && Array.isArray(candidate.content.parts)) {
        return candidate.content.parts.map((part) => typeof part.text === "string" ? part.text : "").filter((text) => text.length > 0).join("");
      }
      return "";
    }).filter((text) => text.length > 0);
    if (responseTexts.length > 0) {
      span.setAttributes({
        [GEN_AI_RESPONSE_TEXT_ATTRIBUTE]: responseTexts.join("")
      });
    }
  }
  if (recordOutputs && response.functionCalls) {
    const functionCalls = response.functionCalls;
    if (Array.isArray(functionCalls) && functionCalls.length > 0) {
      span.setAttributes({
        [GEN_AI_RESPONSE_TOOL_CALLS_ATTRIBUTE]: JSON.stringify(functionCalls)
      });
    }
  }
}
function instrumentMethod(originalMethod, methodPath, instrumentedMethod, context, options) {
  const isEmbeddings = instrumentedMethod.operation === "embeddings";
  return new Proxy(originalMethod, {
    apply(target, _2, args) {
      const operationName = instrumentedMethod.operation || "unknown";
      const params = args[0];
      const requestAttributes = extractRequestAttributes(operationName, params, context);
      const model = requestAttributes[GEN_AI_REQUEST_MODEL_ATTRIBUTE] ?? "unknown";
      if (instrumentedMethod.streaming) {
        return startSpanManual(
          {
            name: `${operationName} ${model}`,
            op: `gen_ai.${operationName}`,
            attributes: requestAttributes
          },
          async (span) => {
            try {
              if (options.recordInputs && params) {
                addPrivateRequestAttributes(
                  span,
                  params,
                  isEmbeddings,
                  shouldEnableTruncation(options.enableTruncation)
                );
              }
              const stream = await target.apply(context, args);
              return instrumentStream(stream, span, Boolean(options.recordOutputs));
            } catch (error2) {
              span.setStatus({ code: SPAN_STATUS_ERROR, message: "internal_error" });
              captureException(error2, {
                mechanism: {
                  handled: false,
                  type: "auto.ai.google_genai",
                  data: { function: methodPath }
                }
              });
              span.end();
              throw error2;
            }
          }
        );
      }
      return startSpan(
        {
          name: `${operationName} ${model}`,
          op: `gen_ai.${operationName}`,
          attributes: requestAttributes
        },
        (span) => {
          if (options.recordInputs && params) {
            addPrivateRequestAttributes(span, params, isEmbeddings, shouldEnableTruncation(options.enableTruncation));
          }
          return handleCallbackErrors(
            () => target.apply(context, args),
            (error2) => {
              captureException(error2, {
                mechanism: { handled: false, type: "auto.ai.google_genai", data: { function: methodPath } }
              });
            },
            () => {
            },
            (result) => {
              if (!isEmbeddings) {
                addResponseAttributes(span, result, options.recordOutputs);
              }
            }
          );
        }
      );
    }
  });
}
function createDeepProxy(target, currentPath = "", options) {
  return new Proxy(target, {
    get: (t2, prop, receiver) => {
      const value = Reflect.get(t2, prop, receiver);
      const methodPath = buildMethodPath(currentPath, String(prop));
      const instrumentedMethod = GOOGLE_GENAI_METHOD_REGISTRY[methodPath];
      if (typeof value === "function" && instrumentedMethod) {
        const wrappedMethod = instrumentedMethod.operation ? instrumentMethod(value, methodPath, instrumentedMethod, t2, options) : value.bind(t2);
        if (!instrumentedMethod.proxyResultPath) {
          return wrappedMethod;
        }
        return function(...args) {
          const result = wrappedMethod(...args);
          if (result && typeof result === "object") {
            return createDeepProxy(result, instrumentedMethod.proxyResultPath, options);
          }
          return result;
        };
      }
      if (typeof value === "function") {
        return value.bind(t2);
      }
      if (value && typeof value === "object") {
        return createDeepProxy(value, methodPath, options);
      }
      return value;
    }
  });
}
function instrumentGoogleGenAIClient(client, options) {
  return createDeepProxy(client, "", resolveAIRecordingOptions(options));
}
const LANGCHAIN_ORIGIN = "auto.ai.langchain";
const ROLE_MAP = {
  human: "user",
  ai: "assistant",
  assistant: "assistant",
  system: "system",
  function: "function",
  tool: "tool"
};
const setIfDefined = (target, key, value) => {
  if (value != null) target[key] = value;
};
const setNumberIfDefined = (target, key, value) => {
  const n2 = Number(value);
  if (!Number.isNaN(n2)) target[key] = n2;
};
function asString(v2) {
  if (typeof v2 === "string") return v2;
  try {
    return JSON.stringify(v2);
  } catch {
    return String(v2);
  }
}
function normalizeContent(v2) {
  if (Array.isArray(v2)) {
    try {
      const stripped = v2.map(
        (part) => part && typeof part === "object" && isContentMedia(part) ? stripInlineMediaFromSingleMessage(part) : part
      );
      return JSON.stringify(stripped);
    } catch {
      return String(v2);
    }
  }
  return asString(v2);
}
function normalizeMessageRole(role) {
  const normalized = role.toLowerCase();
  return ROLE_MAP[normalized] ?? normalized;
}
function normalizeRoleNameFromCtor(name) {
  if (name.includes("System")) return "system";
  if (name.includes("Human")) return "user";
  if (name.includes("AI") || name.includes("Assistant")) return "assistant";
  if (name.includes("Function")) return "function";
  if (name.includes("Tool")) return "tool";
  return "user";
}
function getInvocationParams(tags) {
  if (!tags || Array.isArray(tags)) return void 0;
  return tags.invocation_params;
}
function normalizeLangChainMessages(messages) {
  return messages.map((message) => {
    const maybeGetType = message._getType;
    if (typeof maybeGetType === "function") {
      const messageType = maybeGetType.call(message);
      return {
        role: normalizeMessageRole(messageType),
        content: normalizeContent(message.content)
      };
    }
    if (message.lc === 1 && message.kwargs) {
      const id = message.id;
      const messageType = Array.isArray(id) && id.length > 0 ? id[id.length - 1] : "";
      const role = typeof messageType === "string" ? normalizeRoleNameFromCtor(messageType) : "user";
      return {
        role: normalizeMessageRole(role),
        content: normalizeContent(message.kwargs?.content)
      };
    }
    if (message.type) {
      const role = String(message.type).toLowerCase();
      return {
        role: normalizeMessageRole(role),
        content: normalizeContent(message.content)
      };
    }
    if (message.role) {
      return {
        role: normalizeMessageRole(String(message.role)),
        content: normalizeContent(message.content)
      };
    }
    const ctor = message.constructor?.name;
    if (ctor && ctor !== "Object") {
      return {
        role: normalizeMessageRole(normalizeRoleNameFromCtor(ctor)),
        content: normalizeContent(message.content)
      };
    }
    return {
      role: "user",
      content: normalizeContent(message.content)
    };
  });
}
function extractCommonRequestAttributes(serialized, invocationParams, langSmithMetadata) {
  const attrs = {};
  const kwargs = "kwargs" in serialized ? serialized.kwargs : void 0;
  const temperature = invocationParams?.temperature ?? langSmithMetadata?.ls_temperature ?? kwargs?.temperature;
  setNumberIfDefined(attrs, GEN_AI_REQUEST_TEMPERATURE_ATTRIBUTE, temperature);
  const maxTokens = invocationParams?.max_tokens ?? langSmithMetadata?.ls_max_tokens ?? kwargs?.max_tokens;
  setNumberIfDefined(attrs, GEN_AI_REQUEST_MAX_TOKENS_ATTRIBUTE, maxTokens);
  const topP = invocationParams?.top_p ?? kwargs?.top_p;
  setNumberIfDefined(attrs, GEN_AI_REQUEST_TOP_P_ATTRIBUTE, topP);
  const frequencyPenalty = invocationParams?.frequency_penalty;
  setNumberIfDefined(attrs, GEN_AI_REQUEST_FREQUENCY_PENALTY_ATTRIBUTE, frequencyPenalty);
  const presencePenalty = invocationParams?.presence_penalty;
  setNumberIfDefined(attrs, GEN_AI_REQUEST_PRESENCE_PENALTY_ATTRIBUTE, presencePenalty);
  if (invocationParams && "stream" in invocationParams) {
    setIfDefined(attrs, GEN_AI_REQUEST_STREAM_ATTRIBUTE, Boolean(invocationParams.stream));
  }
  return attrs;
}
function baseRequestAttributes(system, modelName, serialized, invocationParams, langSmithMetadata) {
  return {
    [GEN_AI_SYSTEM_ATTRIBUTE]: asString(system ?? "langchain"),
    [GEN_AI_OPERATION_NAME_ATTRIBUTE]: "chat",
    [GEN_AI_REQUEST_MODEL_ATTRIBUTE]: asString(modelName),
    [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: LANGCHAIN_ORIGIN,
    ...extractCommonRequestAttributes(serialized, invocationParams, langSmithMetadata)
  };
}
function extractLLMRequestAttributes(llm, prompts, recordInputs, enableTruncation, invocationParams, langSmithMetadata) {
  const system = langSmithMetadata?.ls_provider;
  const modelName = invocationParams?.model ?? langSmithMetadata?.ls_model_name ?? "unknown";
  const attrs = baseRequestAttributes(system, modelName, llm, invocationParams, langSmithMetadata);
  if (recordInputs && Array.isArray(prompts) && prompts.length > 0) {
    setIfDefined(attrs, GEN_AI_INPUT_MESSAGES_ORIGINAL_LENGTH_ATTRIBUTE, prompts.length);
    const messages = prompts.map((p2) => ({ role: "user", content: p2 }));
    setIfDefined(
      attrs,
      GEN_AI_INPUT_MESSAGES_ATTRIBUTE,
      enableTruncation ? getTruncatedJsonString(messages) : getJsonString(messages)
    );
  }
  return attrs;
}
function extractChatModelRequestAttributes(llm, langChainMessages, recordInputs, enableTruncation, invocationParams, langSmithMetadata) {
  const system = langSmithMetadata?.ls_provider ?? llm.id?.[2];
  const modelName = invocationParams?.model ?? langSmithMetadata?.ls_model_name ?? "unknown";
  const attrs = baseRequestAttributes(system, modelName, llm, invocationParams, langSmithMetadata);
  if (recordInputs && Array.isArray(langChainMessages) && langChainMessages.length > 0) {
    const normalized = normalizeLangChainMessages(langChainMessages.flat());
    const { systemInstructions, filteredMessages } = extractSystemInstructions(normalized);
    if (systemInstructions) {
      setIfDefined(attrs, GEN_AI_SYSTEM_INSTRUCTIONS_ATTRIBUTE, systemInstructions);
    }
    const filteredLength = Array.isArray(filteredMessages) ? filteredMessages.length : 0;
    setIfDefined(attrs, GEN_AI_INPUT_MESSAGES_ORIGINAL_LENGTH_ATTRIBUTE, filteredLength);
    setIfDefined(
      attrs,
      GEN_AI_INPUT_MESSAGES_ATTRIBUTE,
      enableTruncation ? getTruncatedJsonString(filteredMessages) : getJsonString(filteredMessages)
    );
  }
  return attrs;
}
function addToolCallsAttributes(generations, attrs) {
  const toolCalls = [];
  const flatGenerations = generations.flat();
  for (const gen of flatGenerations) {
    const msg = gen.message;
    const msgToolCalls = msg?.tool_calls;
    if (Array.isArray(msgToolCalls) && msgToolCalls.length > 0) {
      toolCalls.push(...msgToolCalls);
    } else {
      const content = gen.message?.content;
      if (Array.isArray(content)) {
        for (const item of content) {
          const t2 = item;
          if (t2.type === "tool_use") toolCalls.push(t2);
        }
      }
    }
  }
  if (toolCalls.length > 0) {
    setIfDefined(attrs, GEN_AI_RESPONSE_TOOL_CALLS_ATTRIBUTE, asString(toolCalls));
  }
}
function addTokenUsageAttributes(llmOutput, attrs) {
  if (!llmOutput) return;
  const tokenUsage = llmOutput.tokenUsage;
  const anthropicUsage = llmOutput.usage;
  if (tokenUsage) {
    setNumberIfDefined(attrs, GEN_AI_USAGE_INPUT_TOKENS_ATTRIBUTE, tokenUsage.promptTokens);
    setNumberIfDefined(attrs, GEN_AI_USAGE_OUTPUT_TOKENS_ATTRIBUTE, tokenUsage.completionTokens);
    setNumberIfDefined(attrs, GEN_AI_USAGE_TOTAL_TOKENS_ATTRIBUTE, tokenUsage.totalTokens);
  } else if (anthropicUsage) {
    setNumberIfDefined(attrs, GEN_AI_USAGE_INPUT_TOKENS_ATTRIBUTE, anthropicUsage.input_tokens);
    setNumberIfDefined(attrs, GEN_AI_USAGE_OUTPUT_TOKENS_ATTRIBUTE, anthropicUsage.output_tokens);
    const input = Number(anthropicUsage.input_tokens);
    const output = Number(anthropicUsage.output_tokens);
    const total = (Number.isNaN(input) ? 0 : input) + (Number.isNaN(output) ? 0 : output);
    if (total > 0) setNumberIfDefined(attrs, GEN_AI_USAGE_TOTAL_TOKENS_ATTRIBUTE, total);
    if (anthropicUsage.cache_creation_input_tokens !== void 0)
      setNumberIfDefined(
        attrs,
        GEN_AI_USAGE_CACHE_CREATION_INPUT_TOKENS_ATTRIBUTE,
        anthropicUsage.cache_creation_input_tokens
      );
    if (anthropicUsage.cache_read_input_tokens !== void 0)
      setNumberIfDefined(attrs, GEN_AI_USAGE_CACHE_READ_INPUT_TOKENS_ATTRIBUTE, anthropicUsage.cache_read_input_tokens);
  }
}
function extractLlmResponseAttributes(llmResult, recordOutputs) {
  if (!llmResult) return;
  const attrs = {};
  if (Array.isArray(llmResult.generations)) {
    const finishReasons = llmResult.generations.flat().map((g2) => {
      if (g2.generationInfo?.finish_reason) {
        return g2.generationInfo.finish_reason;
      }
      if (g2.generation_info?.finish_reason) {
        return g2.generation_info.finish_reason;
      }
      return null;
    }).filter((r2) => typeof r2 === "string");
    if (finishReasons.length > 0) {
      setIfDefined(attrs, GEN_AI_RESPONSE_FINISH_REASONS_ATTRIBUTE, asString(finishReasons));
    }
    addToolCallsAttributes(llmResult.generations, attrs);
    if (recordOutputs) {
      const texts = llmResult.generations.flat().map((gen) => gen.text ?? gen.message?.content).filter((t2) => typeof t2 === "string");
      if (texts.length > 0) {
        setIfDefined(attrs, GEN_AI_RESPONSE_TEXT_ATTRIBUTE, asString(texts));
      }
    }
  }
  addTokenUsageAttributes(llmResult.llmOutput, attrs);
  const llmOutput = llmResult.llmOutput;
  const firstGeneration = llmResult.generations?.[0]?.[0];
  const v1Message = firstGeneration?.message;
  const modelName = llmOutput?.model_name ?? llmOutput?.model ?? v1Message?.response_metadata?.model_name;
  if (modelName) setIfDefined(attrs, GEN_AI_RESPONSE_MODEL_ATTRIBUTE, modelName);
  const responseId = llmOutput?.id ?? v1Message?.id;
  if (responseId) {
    setIfDefined(attrs, GEN_AI_RESPONSE_ID_ATTRIBUTE, responseId);
  }
  const stopReason = llmOutput?.stop_reason ?? v1Message?.response_metadata?.finish_reason;
  if (stopReason) {
    setIfDefined(attrs, GEN_AI_RESPONSE_STOP_REASON_ATTRIBUTE, asString(stopReason));
  }
  return attrs;
}
function getAgentNameFromMetadata(metadata) {
  const attrs = {};
  const agentName = metadata?.lc_agent_name;
  if (typeof agentName === "string") {
    attrs[GEN_AI_AGENT_NAME_ATTRIBUTE] = agentName;
  }
  return attrs;
}
function extractToolDefinitions(extraParams) {
  const tools = extraParams?.invocation_params?.tools ?? extraParams?.options?.tools;
  if (!Array.isArray(tools) || tools.length === 0) return void 0;
  const toolDefs = tools.map((tool) => {
    const fn = tool.function;
    return {
      type: "function",
      name: tool.name ?? fn?.name ?? "",
      description: tool.description ?? fn?.description
    };
  });
  return JSON.stringify(toolDefs);
}
function isCallbackManager(value) {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value;
  return typeof candidate.addHandler === "function" && typeof candidate.copy === "function";
}
function isSentryHandler(handler) {
  return typeof handler === "object" && handler?.name === "SentryCallbackHandler";
}
function containsSentryHandler(handlers2) {
  return handlers2.some(isSentryHandler);
}
function _INTERNAL_mergeLangChainCallbackHandler(existing, sentryHandler) {
  if (!existing) {
    return [sentryHandler];
  }
  if (isCallbackManager(existing)) {
    if (containsSentryHandler(existing.handlers ?? [])) {
      return existing;
    }
    const copied = existing.copy();
    copied.addHandler(sentryHandler, true);
    return copied;
  }
  const handlers2 = Array.isArray(existing) ? existing : [existing];
  if (containsSentryHandler(handlers2)) {
    return existing;
  }
  return [...handlers2, sentryHandler];
}
function createLangChainCallbackHandler(options = {}) {
  const { recordInputs, recordOutputs } = resolveAIRecordingOptions(options);
  const enableTruncation = shouldEnableTruncation(options.enableTruncation);
  const spanMap = /* @__PURE__ */ new Map();
  const exitSpan = (runId) => {
    const span = spanMap.get(runId);
    if (span?.isRecording()) {
      span.end();
      spanMap.delete(runId);
    }
  };
  const handler = {
    // Required LangChain BaseCallbackHandler properties
    lc_serializable: false,
    lc_namespace: ["langchain_core", "callbacks", "sentry"],
    lc_secrets: void 0,
    lc_attributes: void 0,
    lc_aliases: void 0,
    lc_serializable_keys: void 0,
    lc_id: ["langchain_core", "callbacks", "sentry"],
    lc_kwargs: {},
    name: "SentryCallbackHandler",
    // BaseCallbackHandlerInput boolean flags
    ignoreLLM: false,
    ignoreChain: false,
    ignoreAgent: false,
    ignoreRetriever: false,
    ignoreCustomEvent: false,
    raiseError: false,
    awaitHandlers: true,
    handleLLMStart(llm, prompts, runId, _parentRunId, _extraParams, tags, metadata, _runName) {
      const invocationParams = getInvocationParams(tags);
      const attributes = extractLLMRequestAttributes(
        llm,
        prompts,
        recordInputs,
        enableTruncation,
        invocationParams,
        metadata
      );
      const modelName = attributes[GEN_AI_REQUEST_MODEL_ATTRIBUTE];
      const operationName = attributes[GEN_AI_OPERATION_NAME_ATTRIBUTE];
      startSpanManual(
        {
          name: `${operationName} ${modelName}`,
          op: "gen_ai.chat",
          attributes: {
            ...getAgentNameFromMetadata(metadata),
            ...attributes,
            [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "gen_ai.chat"
          }
        },
        (span) => {
          spanMap.set(runId, span);
          return span;
        }
      );
    },
    // Chat Model Start Handler
    handleChatModelStart(llm, messages, runId, _parentRunId, extraParams, tags, metadata, _runName) {
      const invocationParams = getInvocationParams(tags);
      const attributes = extractChatModelRequestAttributes(
        llm,
        messages,
        recordInputs,
        enableTruncation,
        invocationParams,
        metadata
      );
      const toolDefsJson = extractToolDefinitions(extraParams);
      if (toolDefsJson) {
        attributes[GEN_AI_REQUEST_AVAILABLE_TOOLS_ATTRIBUTE] = toolDefsJson;
      }
      const modelName = attributes[GEN_AI_REQUEST_MODEL_ATTRIBUTE];
      const operationName = attributes[GEN_AI_OPERATION_NAME_ATTRIBUTE];
      startSpanManual(
        {
          name: `${operationName} ${modelName}`,
          op: "gen_ai.chat",
          attributes: {
            ...getAgentNameFromMetadata(metadata),
            ...attributes,
            [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "gen_ai.chat"
          }
        },
        (span) => {
          spanMap.set(runId, span);
          return span;
        }
      );
    },
    // LLM End Handler - note: handleLLMEnd with capital LLM (used by both LLMs and chat models!)
    handleLLMEnd(output, runId, _parentRunId, _tags, _extraParams) {
      const span = spanMap.get(runId);
      if (span?.isRecording()) {
        const attributes = extractLlmResponseAttributes(output, recordOutputs);
        if (attributes) {
          span.setAttributes(attributes);
        }
        exitSpan(runId);
      }
    },
    // LLM Error Handler - note: handleLLMError with capital LLM
    handleLLMError(error2, runId) {
      const span = spanMap.get(runId);
      if (span?.isRecording()) {
        span.setStatus({ code: SPAN_STATUS_ERROR, message: "internal_error" });
        exitSpan(runId);
      }
      captureException(error2, {
        mechanism: {
          handled: false,
          type: `${LANGCHAIN_ORIGIN}.llm_error_handler`
        }
      });
    },
    // Chain Start Handler
    handleChainStart(chain, inputs, runId, _parentRunId, _tags, metadata, _runType, runName) {
      if (metadata?.__sentry_langgraph__) {
        return;
      }
      const chainName = runName || chain.name || "unknown_chain";
      const attributes = {
        [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ai.langchain",
        "langchain.chain.name": chainName
      };
      if (recordInputs) {
        attributes["langchain.chain.inputs"] = JSON.stringify(inputs);
      }
      startSpanManual(
        {
          name: `chain ${chainName}`,
          op: "gen_ai.invoke_agent",
          attributes: {
            ...attributes,
            [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "gen_ai.invoke_agent"
          }
        },
        (span) => {
          spanMap.set(runId, span);
          return span;
        }
      );
    },
    // Chain End Handler
    handleChainEnd(outputs, runId) {
      const span = spanMap.get(runId);
      if (span?.isRecording()) {
        if (recordOutputs) {
          span.setAttributes({
            "langchain.chain.outputs": JSON.stringify(outputs)
          });
        }
        exitSpan(runId);
      }
    },
    // Chain Error Handler
    handleChainError(error2, runId) {
      const span = spanMap.get(runId);
      if (span?.isRecording()) {
        span.setStatus({ code: SPAN_STATUS_ERROR, message: "internal_error" });
        exitSpan(runId);
      }
      captureException(error2, {
        mechanism: {
          handled: false,
          type: `${LANGCHAIN_ORIGIN}.chain_error_handler`
        }
      });
    },
    // Tool Start Handler
    handleToolStart(tool, input, runId, _parentRunId, _tags, metadata, runName) {
      if (metadata?.__sentry_langgraph__) {
        return;
      }
      const toolName = runName || tool.name || "unknown_tool";
      const attributes = {
        ...getAgentNameFromMetadata(metadata),
        [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: LANGCHAIN_ORIGIN,
        [GEN_AI_OPERATION_NAME_ATTRIBUTE]: "execute_tool",
        [GEN_AI_TOOL_NAME_ATTRIBUTE]: toolName
      };
      if (recordInputs) {
        attributes[GEN_AI_TOOL_INPUT_ATTRIBUTE] = input;
      }
      startSpanManual(
        {
          name: `execute_tool ${toolName}`,
          op: "gen_ai.execute_tool",
          attributes: {
            ...attributes,
            [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "gen_ai.execute_tool"
          }
        },
        (span) => {
          spanMap.set(runId, span);
          return span;
        }
      );
    },
    // Tool End Handler
    handleToolEnd(output, runId) {
      const span = spanMap.get(runId);
      if (span?.isRecording()) {
        if (recordOutputs) {
          const outputObj = output;
          const content = outputObj && typeof outputObj === "object" && "content" in outputObj ? outputObj.content : output;
          span.setAttributes({
            [GEN_AI_TOOL_OUTPUT_ATTRIBUTE]: typeof content === "string" ? content : JSON.stringify(content)
          });
        }
        exitSpan(runId);
      }
    },
    // Tool Error Handler
    handleToolError(error2, runId) {
      const span = spanMap.get(runId);
      if (span?.isRecording()) {
        span.setStatus({ code: SPAN_STATUS_ERROR, message: "internal_error" });
        exitSpan(runId);
      }
      captureException(error2, {
        mechanism: {
          handled: false,
          type: `${LANGCHAIN_ORIGIN}.tool_error_handler`
        }
      });
    },
    // LangChain BaseCallbackHandler required methods
    copy() {
      return handler;
    },
    toJSON() {
      return {
        lc: 1,
        type: "not_implemented",
        id: handler.lc_id
      };
    },
    toJSONNotImplemented() {
      return {
        lc: 1,
        type: "not_implemented",
        id: handler.lc_id
      };
    }
  };
  return handler;
}
const LANGGRAPH_ORIGIN = "auto.ai.langgraph";
function extractLLMFromParams(args) {
  const arg = args[0];
  if (typeof arg !== "object" || !arg || !("llm" in arg) || !arg.llm || typeof arg.llm !== "object") {
    return null;
  }
  const llm = arg.llm;
  if (typeof llm.modelName !== "string" && typeof llm.model !== "string") {
    return null;
  }
  return llm;
}
function extractAgentNameFromParams(args) {
  const arg = args[0];
  if (typeof arg === "object" && !!arg && "name" in arg && typeof arg.name === "string") {
    return arg.name;
  }
  return null;
}
function wrapToolsWithSpans(tools, options, agentName) {
  const SENTRY_WRAPPED = "__sentry_tool_wrapped__";
  for (const tool of tools) {
    if (!tool || typeof tool !== "object") {
      continue;
    }
    const t2 = tool;
    const originalInvoke = t2.invoke;
    if (typeof originalInvoke !== "function" || Object.prototype.hasOwnProperty.call(t2, SENTRY_WRAPPED)) {
      continue;
    }
    const toolName = typeof t2.name === "string" ? t2.name : "unknown_tool";
    const toolDescription = typeof t2.description === "string" ? t2.description : void 0;
    const wrappedInvoke = new Proxy(originalInvoke, {
      apply(target, thisArg, args) {
        const spanAttributes = {
          [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: LANGGRAPH_ORIGIN,
          [SEMANTIC_ATTRIBUTE_SENTRY_OP]: GEN_AI_EXECUTE_TOOL_OPERATION_ATTRIBUTE,
          [GEN_AI_OPERATION_NAME_ATTRIBUTE]: "execute_tool",
          [GEN_AI_TOOL_NAME_ATTRIBUTE]: toolName,
          [GEN_AI_TOOL_TYPE_ATTRIBUTE]: "function"
        };
        const callConfig = args[1];
        const callAgentName = callConfig?.metadata?.lc_agent_name ?? agentName;
        if (typeof callAgentName === "string") {
          spanAttributes[GEN_AI_AGENT_NAME_ATTRIBUTE] = callAgentName;
        }
        if (toolDescription) {
          spanAttributes[GEN_AI_TOOL_DESCRIPTION_ATTRIBUTE] = toolDescription;
        }
        const input = args[0];
        if (typeof input === "object" && !!input) {
          if ("id" in input && typeof input.id === "string") {
            spanAttributes[GEN_AI_TOOL_CALL_ID_ATTRIBUTE] = input.id;
          }
          if (options.recordInputs) {
            const toolArgs = "args" in input && typeof input.args === "object" ? input.args : input;
            try {
              spanAttributes[GEN_AI_TOOL_INPUT_ATTRIBUTE] = JSON.stringify(toolArgs);
            } catch {
            }
          }
        }
        return startSpan(
          {
            op: GEN_AI_EXECUTE_TOOL_OPERATION_ATTRIBUTE,
            name: `execute_tool ${toolName}`,
            attributes: spanAttributes
          },
          async (span) => {
            try {
              const result = await Reflect.apply(target, thisArg, args);
              if (options.recordOutputs) {
                try {
                  const resultObj = result;
                  const content = resultObj && typeof resultObj === "object" && "content" in resultObj ? resultObj.content : result;
                  span.setAttribute(
                    GEN_AI_TOOL_OUTPUT_ATTRIBUTE,
                    typeof content === "string" ? content : JSON.stringify(content)
                  );
                } catch {
                }
              }
              return result;
            } catch (error2) {
              span.setStatus({ code: SPAN_STATUS_ERROR, message: "internal_error" });
              captureException(error2, {
                mechanism: {
                  handled: false,
                  type: "auto.ai.langgraph.error"
                }
              });
              throw error2;
            }
          }
        );
      }
    });
    t2.invoke = wrappedInvoke;
    Object.defineProperty(t2, SENTRY_WRAPPED, { value: true, enumerable: false });
  }
  return tools;
}
function extractToolCalls(messages) {
  if (!messages || messages.length === 0) {
    return null;
  }
  const toolCalls = [];
  for (const message of messages) {
    if (message && typeof message === "object") {
      const msgToolCalls = message.tool_calls;
      if (msgToolCalls && Array.isArray(msgToolCalls)) {
        toolCalls.push(...msgToolCalls);
      }
    }
  }
  return toolCalls.length > 0 ? toolCalls : null;
}
function extractTokenUsageFromMessage(message) {
  const msg = message;
  let inputTokens = 0;
  let outputTokens = 0;
  let totalTokens = 0;
  if (msg.usage_metadata && typeof msg.usage_metadata === "object") {
    const usage = msg.usage_metadata;
    if (typeof usage.input_tokens === "number") {
      inputTokens = usage.input_tokens;
    }
    if (typeof usage.output_tokens === "number") {
      outputTokens = usage.output_tokens;
    }
    if (typeof usage.total_tokens === "number") {
      totalTokens = usage.total_tokens;
    }
    return { inputTokens, outputTokens, totalTokens };
  }
  if (msg.response_metadata && typeof msg.response_metadata === "object") {
    const metadata = msg.response_metadata;
    if (metadata.tokenUsage && typeof metadata.tokenUsage === "object") {
      const tokenUsage = metadata.tokenUsage;
      if (typeof tokenUsage.promptTokens === "number") {
        inputTokens = tokenUsage.promptTokens;
      }
      if (typeof tokenUsage.completionTokens === "number") {
        outputTokens = tokenUsage.completionTokens;
      }
      if (typeof tokenUsage.totalTokens === "number") {
        totalTokens = tokenUsage.totalTokens;
      }
    }
  }
  return { inputTokens, outputTokens, totalTokens };
}
function extractModelMetadata(span, message) {
  const msg = message;
  if (msg.response_metadata && typeof msg.response_metadata === "object") {
    const metadata = msg.response_metadata;
    if (metadata.model_name && typeof metadata.model_name === "string") {
      span.setAttribute(GEN_AI_RESPONSE_MODEL_ATTRIBUTE, metadata.model_name);
    }
    if (metadata.finish_reason && typeof metadata.finish_reason === "string") {
      span.setAttribute(GEN_AI_RESPONSE_FINISH_REASONS_ATTRIBUTE, [metadata.finish_reason]);
    }
  }
}
function extractToolsFromCompiledGraph(compiledGraph) {
  if (!compiledGraph.builder?.nodes?.tools?.runnable?.tools) {
    return null;
  }
  const tools = compiledGraph.builder?.nodes?.tools?.runnable?.tools;
  if (!tools || !Array.isArray(tools) || tools.length === 0) {
    return null;
  }
  return tools.map((tool) => ({
    name: tool.lc_kwargs?.name,
    description: tool.lc_kwargs?.description,
    schema: tool.lc_kwargs?.schema
  }));
}
function setResponseAttributes(span, inputMessages, result) {
  const resultObj = result;
  const outputMessages = resultObj?.messages;
  if (!outputMessages || !Array.isArray(outputMessages)) {
    return;
  }
  const inputCount = inputMessages?.length ?? 0;
  const newMessages = outputMessages.length > inputCount ? outputMessages.slice(inputCount) : [];
  if (newMessages.length === 0) {
    return;
  }
  const toolCalls = extractToolCalls(newMessages);
  if (toolCalls) {
    span.setAttribute(GEN_AI_RESPONSE_TOOL_CALLS_ATTRIBUTE, JSON.stringify(toolCalls));
  }
  const normalizedNewMessages = normalizeLangChainMessages(newMessages);
  span.setAttribute(GEN_AI_RESPONSE_TEXT_ATTRIBUTE, JSON.stringify(normalizedNewMessages));
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalTokens = 0;
  for (const message of newMessages) {
    const tokens = extractTokenUsageFromMessage(message);
    totalInputTokens += tokens.inputTokens;
    totalOutputTokens += tokens.outputTokens;
    totalTokens += tokens.totalTokens;
    extractModelMetadata(span, message);
  }
  if (totalInputTokens > 0) {
    span.setAttribute(GEN_AI_USAGE_INPUT_TOKENS_ATTRIBUTE, totalInputTokens);
  }
  if (totalOutputTokens > 0) {
    span.setAttribute(GEN_AI_USAGE_OUTPUT_TOKENS_ATTRIBUTE, totalOutputTokens);
  }
  if (totalTokens > 0) {
    span.setAttribute(GEN_AI_USAGE_TOTAL_TOKENS_ATTRIBUTE, totalTokens);
  }
}
let _insideCreateReactAgent = false;
const SENTRY_PATCHED = "__sentry_patched__";
function instrumentStateGraphCompile(originalCompile, options) {
  if (Object.prototype.hasOwnProperty.call(originalCompile, SENTRY_PATCHED)) {
    return originalCompile;
  }
  const sentryHandler = createLangChainCallbackHandler(options);
  const wrapped = new Proxy(originalCompile, {
    apply(target, thisArg, args) {
      if (_insideCreateReactAgent) {
        return Reflect.apply(target, thisArg, args);
      }
      return startSpan(
        {
          op: "gen_ai.create_agent",
          name: "create_agent",
          attributes: {
            [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: LANGGRAPH_ORIGIN,
            [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "gen_ai.create_agent",
            [GEN_AI_OPERATION_NAME_ATTRIBUTE]: "create_agent"
          }
        },
        (span) => {
          try {
            const compiledGraph = Reflect.apply(target, thisArg, args);
            const compileOptions = args.length > 0 ? args[0] : {};
            if (compileOptions?.name && typeof compileOptions.name === "string") {
              span.setAttribute(GEN_AI_AGENT_NAME_ATTRIBUTE, compileOptions.name);
              span.updateName(`create_agent ${compileOptions.name}`);
            }
            const originalInvoke = compiledGraph.invoke;
            if (originalInvoke && typeof originalInvoke === "function") {
              compiledGraph.invoke = instrumentCompiledGraphInvoke(
                originalInvoke.bind(compiledGraph),
                compiledGraph,
                compileOptions,
                options,
                void 0,
                sentryHandler
              );
            }
            return compiledGraph;
          } catch (error2) {
            span.setStatus({ code: SPAN_STATUS_ERROR, message: "internal_error" });
            captureException(error2, {
              mechanism: {
                handled: false,
                type: "auto.ai.langgraph.error"
              }
            });
            throw error2;
          }
        }
      );
    }
  });
  Object.defineProperty(wrapped, SENTRY_PATCHED, { value: true, enumerable: false });
  return wrapped;
}
function instrumentCompiledGraphInvoke(originalInvoke, graphInstance, compileOptions, options, llm, sentryCallbackHandler) {
  return new Proxy(originalInvoke, {
    apply(target, thisArg, args) {
      const modelName = llm?.modelName ?? llm?.model;
      return startSpan(
        {
          op: "gen_ai.invoke_agent",
          name: "invoke_agent",
          attributes: {
            [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: LANGGRAPH_ORIGIN,
            [SEMANTIC_ATTRIBUTE_SENTRY_OP]: GEN_AI_INVOKE_AGENT_OPERATION_ATTRIBUTE,
            [GEN_AI_OPERATION_NAME_ATTRIBUTE]: "invoke_agent"
          }
        },
        async (span) => {
          try {
            const graphName = compileOptions?.name;
            if (graphName && typeof graphName === "string") {
              span.setAttribute(GEN_AI_PIPELINE_NAME_ATTRIBUTE, graphName);
              span.setAttribute(GEN_AI_AGENT_NAME_ATTRIBUTE, graphName);
              span.updateName(`invoke_agent ${graphName}`);
            }
            if (modelName) {
              span.setAttribute(GEN_AI_REQUEST_MODEL_ATTRIBUTE, modelName);
            }
            const config = args.length > 1 ? args[1] : void 0;
            const configurable = config?.configurable;
            const threadId = configurable?.thread_id;
            if (threadId && typeof threadId === "string") {
              span.setAttribute(GEN_AI_CONVERSATION_ID_ATTRIBUTE, threadId);
            }
            if (sentryCallbackHandler) {
              const invokeConfig = args[1] ?? {};
              args[1] = invokeConfig;
              const existingMetadata = invokeConfig.metadata ?? {};
              invokeConfig.metadata = {
                ...existingMetadata,
                __sentry_langgraph__: true,
                ...typeof graphName === "string" ? { lc_agent_name: graphName } : {}
              };
              invokeConfig.callbacks = _INTERNAL_mergeLangChainCallbackHandler(
                invokeConfig.callbacks,
                sentryCallbackHandler
              );
            }
            const tools = extractToolsFromCompiledGraph(graphInstance);
            if (tools) {
              span.setAttribute(GEN_AI_REQUEST_AVAILABLE_TOOLS_ATTRIBUTE, JSON.stringify(tools));
            }
            const recordInputs = options.recordInputs;
            const recordOutputs = options.recordOutputs;
            const inputMessages = args.length > 0 ? args[0]?.messages ?? [] : [];
            if (inputMessages && recordInputs) {
              const normalizedMessages = normalizeLangChainMessages(inputMessages);
              const { systemInstructions, filteredMessages } = extractSystemInstructions(normalizedMessages);
              if (systemInstructions) {
                span.setAttribute(GEN_AI_SYSTEM_INSTRUCTIONS_ATTRIBUTE, systemInstructions);
              }
              const enableTruncation = shouldEnableTruncation(options.enableTruncation);
              const filteredLength = Array.isArray(filteredMessages) ? filteredMessages.length : 0;
              span.setAttributes({
                [GEN_AI_INPUT_MESSAGES_ATTRIBUTE]: enableTruncation ? getTruncatedJsonString(filteredMessages) : getJsonString(filteredMessages),
                [GEN_AI_INPUT_MESSAGES_ORIGINAL_LENGTH_ATTRIBUTE]: filteredLength
              });
            }
            const result = await Reflect.apply(target, thisArg, args);
            if (recordOutputs) {
              setResponseAttributes(span, inputMessages ?? null, result);
            }
            return result;
          } catch (error2) {
            span.setStatus({ code: SPAN_STATUS_ERROR, message: "internal_error" });
            captureException(error2, {
              mechanism: {
                handled: false,
                type: "auto.ai.langgraph.error"
              }
            });
            throw error2;
          }
        }
      );
    }
  });
}
function instrumentCreateReactAgent(originalCreateReactAgent, options) {
  if (Object.prototype.hasOwnProperty.call(originalCreateReactAgent, SENTRY_PATCHED)) {
    return originalCreateReactAgent;
  }
  const resolvedOptions = resolveAIRecordingOptions(options);
  const sentryHandler = createLangChainCallbackHandler(resolvedOptions);
  const wrapped = new Proxy(originalCreateReactAgent, {
    apply(target, thisArg, args) {
      const llm = extractLLMFromParams(args);
      const agentName = extractAgentNameFromParams(args);
      const params = args[0];
      if (params && Array.isArray(params.tools) && params.tools.length > 0) {
        wrapToolsWithSpans(params.tools, resolvedOptions, agentName ?? void 0);
      }
      _insideCreateReactAgent = true;
      let compiledGraph;
      try {
        compiledGraph = Reflect.apply(target, thisArg, args);
      } finally {
        _insideCreateReactAgent = false;
      }
      const originalInvoke = compiledGraph.invoke;
      if (originalInvoke && typeof originalInvoke === "function") {
        const compileOptions = {};
        if (agentName) {
          compileOptions.name = agentName;
        }
        compiledGraph.invoke = instrumentCompiledGraphInvoke(
          originalInvoke.bind(compiledGraph),
          compiledGraph,
          compileOptions,
          resolvedOptions,
          llm,
          sentryHandler
        );
      }
      return compiledGraph;
    }
  });
  Object.defineProperty(wrapped, SENTRY_PATCHED, { value: true, enumerable: false });
  return wrapped;
}
function instrumentLangGraph(stateGraph, options) {
  stateGraph.compile = instrumentStateGraphCompile(stateGraph.compile, resolveAIRecordingOptions(options));
  return stateGraph;
}
const WINDOW$6 = GLOBAL_OBJ;
function getLocationHref() {
  try {
    return WINDOW$6.document.location.href;
  } catch {
    return "";
  }
}
function getComponentName(elem, maxTraverseHeight = 5) {
  if (!WINDOW$6.HTMLElement) {
    return null;
  }
  let currentElem = elem;
  for (let i = 0; i < maxTraverseHeight; i++) {
    if (!currentElem) {
      return null;
    }
    if (currentElem instanceof HTMLElement) {
      if (currentElem.dataset["sentryComponent"]) {
        return currentElem.dataset["sentryComponent"];
      }
      if (currentElem.dataset["sentryElement"]) {
        return currentElem.dataset["sentryElement"];
      }
    }
    currentElem = currentElem.parentNode;
  }
  return null;
}
function inferSystemFromInstance(instance) {
  const name = instance.constructor?.name ?? "";
  if (name.includes("OpenAI")) return "openai";
  if (name.includes("Google")) return "google_genai";
  if (name.includes("Mistral")) return "mistralai";
  if (name.includes("Vertex")) return "google_vertexai";
  if (name.includes("Bedrock")) return "aws_bedrock";
  if (name.includes("Ollama")) return "ollama";
  if (name.includes("Cloudflare")) return "cloudflare";
  if (name.includes("Cohere")) return "cohere";
  return "langchain";
}
function extractEmbeddingAttributes(instance) {
  const embeddingsInstance = instance ?? {};
  const attributes = {
    [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: LANGCHAIN_ORIGIN,
    [SEMANTIC_ATTRIBUTE_SENTRY_OP]: GEN_AI_EMBEDDINGS_OPERATION_ATTRIBUTE,
    [GEN_AI_OPERATION_NAME_ATTRIBUTE]: "embeddings",
    [GEN_AI_REQUEST_MODEL_ATTRIBUTE]: embeddingsInstance.model ?? "unknown"
  };
  attributes[GEN_AI_SYSTEM_ATTRIBUTE] = inferSystemFromInstance(embeddingsInstance);
  if ("dimensions" in embeddingsInstance) {
    attributes[GEN_AI_REQUEST_DIMENSIONS_ATTRIBUTE] = embeddingsInstance.dimensions;
  }
  if ("encodingFormat" in embeddingsInstance) {
    attributes[GEN_AI_REQUEST_ENCODING_FORMAT_ATTRIBUTE] = embeddingsInstance.encodingFormat;
  }
  return attributes;
}
function instrumentEmbeddingMethod(originalMethod, options = {}) {
  const { recordInputs } = resolveAIRecordingOptions(options);
  return new Proxy(originalMethod, {
    apply(target, thisArg, args) {
      const attributes = extractEmbeddingAttributes(thisArg);
      const modelName = attributes[GEN_AI_REQUEST_MODEL_ATTRIBUTE] || "unknown";
      if (recordInputs) {
        const input = args[0];
        if (input != null) {
          attributes[GEN_AI_EMBEDDINGS_INPUT_ATTRIBUTE] = typeof input === "string" ? input : JSON.stringify(input);
        }
      }
      return startSpan(
        {
          name: `embeddings ${modelName}`,
          op: GEN_AI_EMBEDDINGS_OPERATION_ATTRIBUTE,
          attributes
        },
        () => {
          return Reflect.apply(target, thisArg, args).then(void 0, (error2) => {
            captureException(error2, {
              mechanism: { handled: false, type: "auto.ai.langchain" }
            });
            throw error2;
          });
        }
      );
    }
  });
}
function instrumentLangChainEmbeddings(instance, options) {
  const embeddingsInstance = instance;
  if (typeof embeddingsInstance.embedQuery === "function") {
    embeddingsInstance.embedQuery = instrumentEmbeddingMethod(
      embeddingsInstance.embedQuery,
      options
    );
  }
  if (typeof embeddingsInstance.embedDocuments === "function") {
    embeddingsInstance.embedDocuments = instrumentEmbeddingMethod(
      embeddingsInstance.embedDocuments,
      options
    );
  }
  return instance;
}
const WINDOW$5 = GLOBAL_OBJ;
const DOCUMENT = WINDOW$5.document;
const NAVIGATOR$1 = WINDOW$5.navigator;
const TRIGGER_LABEL = "Report a Bug";
const CANCEL_BUTTON_LABEL = "Cancel";
const SUBMIT_BUTTON_LABEL = "Send Bug Report";
const CONFIRM_BUTTON_LABEL = "Confirm";
const FORM_TITLE = "Report a Bug";
const EMAIL_PLACEHOLDER = "your.email@example.org";
const EMAIL_LABEL = "Email";
const MESSAGE_PLACEHOLDER = "What's the bug? What did you expect?";
const MESSAGE_LABEL = "Description";
const NAME_PLACEHOLDER = "Your Name";
const NAME_LABEL = "Name";
const SUCCESS_MESSAGE_TEXT = "Thank you for your report!";
const IS_REQUIRED_LABEL = "(required)";
const ADD_SCREENSHOT_LABEL = "Add a screenshot";
const REMOVE_SCREENSHOT_LABEL = "Remove screenshot";
const HIGHLIGHT_TOOL_TEXT = "Highlight";
const HIDE_TOOL_TEXT = "Hide";
const REMOVE_HIGHLIGHT_TEXT = "Remove";
const ERROR_EMPTY_MESSAGE_TEXT = "Unable to submit feedback with empty message";
const ERROR_NO_CLIENT_TEXT = "No client setup, cannot send feedback.";
const ERROR_TIMEOUT_TEXT = "Unable to determine if Feedback was correctly sent.";
const ERROR_FORBIDDEN_TEXT = "Unable to send feedback. This could be because this domain is not in your list of allowed domains.";
const ERROR_GENERIC_TEXT = "Unable to send feedback. This could be because of network issues, or because you are using an ad-blocker.";
const FEEDBACK_WIDGET_SOURCE = "widget";
const FEEDBACK_API_SOURCE = "api";
const SUCCESS_MESSAGE_TIMEOUT = 5e3;
const DEFAULT_MESSAGES = {
  ERROR_EMPTY_MESSAGE: ERROR_EMPTY_MESSAGE_TEXT,
  ERROR_NO_CLIENT: ERROR_NO_CLIENT_TEXT,
  ERROR_TIMEOUT: ERROR_TIMEOUT_TEXT,
  ERROR_FORBIDDEN: ERROR_FORBIDDEN_TEXT,
  ERROR_GENERIC: ERROR_GENERIC_TEXT
};
function resolveFeedbackErrorMessage(code, messages) {
  return messages?.[code] ?? DEFAULT_MESSAGES[code];
}
function createFeedbackError(code, messages) {
  return new Error(resolveFeedbackErrorMessage(code, messages));
}
const sendFeedback = (params, hint = { includeReplay: true }) => {
  const errorMessages = hint.errorMessages;
  if (!params.message) {
    throw createFeedbackError("ERROR_EMPTY_MESSAGE", errorMessages);
  }
  const client = getClient();
  if (!client) {
    throw createFeedbackError("ERROR_NO_CLIENT", errorMessages);
  }
  if (params.tags && Object.keys(params.tags).length) {
    getCurrentScope().setTags(params.tags);
  }
  const eventId = captureFeedback(
    {
      source: FEEDBACK_API_SOURCE,
      url: getLocationHref(),
      ...params
    },
    hint
  );
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(resolveFeedbackErrorMessage("ERROR_TIMEOUT", errorMessages));
    }, 3e4);
    const cleanup = client.on("afterSendEvent", (event, response) => {
      if (event.event_id !== eventId) {
        return;
      }
      clearTimeout(timeout);
      cleanup();
      if (response?.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
        return resolve(eventId);
      }
      if (response?.statusCode === 403) {
        return reject(resolveFeedbackErrorMessage("ERROR_FORBIDDEN", errorMessages));
      }
      return reject(resolveFeedbackErrorMessage("ERROR_GENERIC", errorMessages));
    });
  });
};
const DEBUG_BUILD$4 = typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__;
function isScreenshotSupported() {
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(NAVIGATOR$1.userAgent)) {
    return false;
  }
  if (/Macintosh/i.test(NAVIGATOR$1.userAgent) && NAVIGATOR$1.maxTouchPoints && NAVIGATOR$1.maxTouchPoints > 1) {
    return false;
  }
  if (!isSecureContext) {
    return false;
  }
  return true;
}
function mergeOptions(defaultOptions2, optionOverrides) {
  return {
    ...defaultOptions2,
    ...optionOverrides,
    tags: {
      ...defaultOptions2.tags,
      ...optionOverrides.tags
    },
    onFormOpen: () => {
      optionOverrides.onFormOpen?.();
      defaultOptions2.onFormOpen?.();
    },
    onFormClose: () => {
      optionOverrides.onFormClose?.();
      defaultOptions2.onFormClose?.();
    },
    onSubmitSuccess: (data, eventId) => {
      optionOverrides.onSubmitSuccess?.(data, eventId);
      defaultOptions2.onSubmitSuccess?.(data, eventId);
    },
    onSubmitError: (error2) => {
      optionOverrides.onSubmitError?.(error2);
      defaultOptions2.onSubmitError?.(error2);
    },
    onFormSubmitted: () => {
      optionOverrides.onFormSubmitted?.();
      defaultOptions2.onFormSubmitted?.();
    },
    themeDark: {
      ...defaultOptions2.themeDark,
      ...optionOverrides.themeDark
    },
    themeLight: {
      ...defaultOptions2.themeLight,
      ...optionOverrides.themeLight
    }
  };
}
function createActorStyles(styleNonce) {
  const style = DOCUMENT.createElement("style");
  style.textContent = `
.widget__actor {
  position: fixed;
  z-index: var(--z-index);
  margin: var(--page-margin);
  inset: var(--actor-inset);

  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;

  font-family: inherit;
  font-size: var(--font-size);
  font-weight: 600;
  line-height: 1.14em;
  text-decoration: none;

  background: var(--actor-background, var(--background));
  border-radius: var(--actor-border-radius, 1.7em/50%);
  border: var(--actor-border, var(--border));
  box-shadow: var(--actor-box-shadow, var(--box-shadow));
  color: var(--actor-color, var(--foreground));
  fill: var(--actor-color, var(--foreground));
  cursor: pointer;
  opacity: 1;
  transition: transform 0.2s ease-in-out;
  transform: translate(0, 0) scale(1);
}
.widget__actor[aria-hidden="true"] {
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
  transform: translate(0, 16px) scale(0.98);
}

.widget__actor:hover {
  background: var(--actor-hover-background, var(--background));
  filter: var(--interactive-filter);
}

.widget__actor svg {
  width: 1.14em;
  height: 1.14em;
}

@media (max-width: 600px) {
  .widget__actor span {
    display: none;
  }
}
`;
  if (styleNonce) {
    style.setAttribute("nonce", styleNonce);
  }
  return style;
}
function setAttributesNS(el, attributes) {
  Object.entries(attributes).forEach(([key, val]) => {
    el.setAttributeNS(null, key, val);
  });
  return el;
}
const SIZE = 20;
const XMLNS$2 = "http://www.w3.org/2000/svg";
function FeedbackIcon() {
  const createElementNS = (tagName) => WINDOW$5.document.createElementNS(XMLNS$2, tagName);
  const svg = setAttributesNS(createElementNS("svg"), {
    width: `${SIZE}`,
    height: `${SIZE}`,
    viewBox: `0 0 ${SIZE} ${SIZE}`,
    fill: "var(--actor-color, var(--foreground))"
  });
  const g2 = setAttributesNS(createElementNS("g"), {
    clipPath: "url(#clip0_57_80)"
  });
  const path = setAttributesNS(createElementNS("path"), {
    ["fill-rule"]: "evenodd",
    ["clip-rule"]: "evenodd",
    d: "M15.6622 15H12.3997C12.2129 14.9959 12.031 14.9396 11.8747 14.8375L8.04965 12.2H7.49956V19.1C7.4875 19.3348 7.3888 19.5568 7.22256 19.723C7.05632 19.8892 6.83435 19.9879 6.59956 20H2.04956C1.80193 19.9968 1.56535 19.8969 1.39023 19.7218C1.21511 19.5467 1.1153 19.3101 1.11206 19.0625V12.2H0.949652C0.824431 12.2017 0.700142 12.1783 0.584123 12.1311C0.468104 12.084 0.362708 12.014 0.274155 11.9255C0.185602 11.8369 0.115689 11.7315 0.0685419 11.6155C0.0213952 11.4995 -0.00202913 11.3752 -0.00034808 11.25V3.75C-0.00900498 3.62067 0.0092504 3.49095 0.0532651 3.36904C0.0972798 3.24712 0.166097 3.13566 0.255372 3.04168C0.344646 2.94771 0.452437 2.87327 0.571937 2.82307C0.691437 2.77286 0.82005 2.74798 0.949652 2.75H8.04965L11.8747 0.1625C12.031 0.0603649 12.2129 0.00407221 12.3997 0H15.6622C15.9098 0.00323746 16.1464 0.103049 16.3215 0.278167C16.4966 0.453286 16.5964 0.689866 16.5997 0.9375V3.25269C17.3969 3.42959 18.1345 3.83026 18.7211 4.41679C19.5322 5.22788 19.9878 6.32796 19.9878 7.47502C19.9878 8.62209 19.5322 9.72217 18.7211 10.5333C18.1345 11.1198 17.3969 11.5205 16.5997 11.6974V14.0125C16.6047 14.1393 16.5842 14.2659 16.5395 14.3847C16.4948 14.5035 16.4268 14.6121 16.3394 14.7042C16.252 14.7962 16.147 14.8698 16.0307 14.9206C15.9144 14.9714 15.7891 14.9984 15.6622 15ZM1.89695 10.325H1.88715V4.625H8.33715C8.52423 4.62301 8.70666 4.56654 8.86215 4.4625L12.6872 1.875H14.7247V13.125H12.6872L8.86215 10.4875C8.70666 10.3835 8.52423 10.327 8.33715 10.325H2.20217C2.15205 10.3167 2.10102 10.3125 2.04956 10.3125C1.9981 10.3125 1.94708 10.3167 1.89695 10.325ZM2.98706 12.2V18.1625H5.66206V12.2H2.98706ZM16.5997 9.93612V5.01393C16.6536 5.02355 16.7072 5.03495 16.7605 5.04814C17.1202 5.13709 17.4556 5.30487 17.7425 5.53934C18.0293 5.77381 18.2605 6.06912 18.4192 6.40389C18.578 6.73866 18.6603 7.10452 18.6603 7.47502C18.6603 7.84552 18.578 8.21139 18.4192 8.54616C18.2605 8.88093 18.0293 9.17624 17.7425 9.41071C17.4556 9.64518 17.1202 9.81296 16.7605 9.90191C16.7072 9.91509 16.6536 9.9265 16.5997 9.93612Z"
  });
  svg.appendChild(g2).appendChild(path);
  const speakerDefs = createElementNS("defs");
  const speakerClipPathDef = setAttributesNS(createElementNS("clipPath"), {
    id: "clip0_57_80"
  });
  const speakerRect = setAttributesNS(createElementNS("rect"), {
    width: `${SIZE}`,
    height: `${SIZE}`,
    fill: "white"
  });
  speakerClipPathDef.appendChild(speakerRect);
  speakerDefs.appendChild(speakerClipPathDef);
  svg.appendChild(speakerDefs).appendChild(speakerClipPathDef).appendChild(speakerRect);
  return svg;
}
function Actor({ triggerLabel, triggerAriaLabel, shadow, styleNonce }) {
  const el = DOCUMENT.createElement("button");
  el.type = "button";
  el.className = "widget__actor";
  el.ariaHidden = "false";
  el.ariaLabel = triggerAriaLabel || triggerLabel || TRIGGER_LABEL;
  el.appendChild(FeedbackIcon());
  if (triggerLabel) {
    const label = DOCUMENT.createElement("span");
    label.appendChild(DOCUMENT.createTextNode(triggerLabel));
    el.appendChild(label);
  }
  const style = createActorStyles(styleNonce);
  return {
    el,
    appendToDom() {
      shadow.appendChild(style);
      shadow.appendChild(el);
    },
    removeFromDom() {
      el.remove();
      style.remove();
    },
    show() {
      el.ariaHidden = "false";
    },
    hide() {
      el.ariaHidden = "true";
    }
  };
}
const PURPLE = "rgba(88, 74, 192, 1)";
const DEFAULT_LIGHT = {
  foreground: "#2b2233",
  background: "#ffffff",
  accentForeground: "white",
  accentBackground: PURPLE,
  successColor: "#268d75",
  errorColor: "#df3338",
  border: "1.5px solid rgba(41, 35, 47, 0.13)",
  boxShadow: "0px 4px 24px 0px rgba(43, 34, 51, 0.12)",
  outline: "1px auto var(--accent-background)",
  interactiveFilter: "brightness(95%)"
};
const DEFAULT_DARK = {
  foreground: "#ebe6ef",
  background: "#29232f",
  accentForeground: "white",
  accentBackground: PURPLE,
  successColor: "#2da98c",
  errorColor: "#f55459",
  border: "1.5px solid rgba(235, 230, 239, 0.15)",
  boxShadow: "0px 4px 24px 0px rgba(43, 34, 51, 0.12)",
  outline: "1px auto var(--accent-background)",
  interactiveFilter: "brightness(150%)"
};
function getThemedCssVariables(theme) {
  return `
  --foreground: ${theme.foreground};
  --background: ${theme.background};
  --accent-foreground: ${theme.accentForeground};
  --accent-background: ${theme.accentBackground};
  --success-color: ${theme.successColor};
  --error-color: ${theme.errorColor};
  --border: ${theme.border};
  --box-shadow: ${theme.boxShadow};
  --outline: ${theme.outline};
  --interactive-filter: ${theme.interactiveFilter};
  `;
}
function createMainStyles({
  colorScheme,
  themeDark,
  themeLight,
  styleNonce
}) {
  const style = DOCUMENT.createElement("style");
  style.textContent = `
:host {
  --font-family: system-ui, 'Helvetica Neue', Arial, sans-serif;
  --font-size: 14px;
  --z-index: 100000;

  --page-margin: 16px;
  --inset: auto 0 0 auto;
  --actor-inset: var(--inset);

  font-family: var(--font-family);
  font-size: var(--font-size);

  ${colorScheme !== "system" ? `color-scheme: only ${colorScheme};` : ""}

  ${getThemedCssVariables(
    colorScheme === "dark" ? { ...DEFAULT_DARK, ...themeDark } : { ...DEFAULT_LIGHT, ...themeLight }
  )}
}

${colorScheme === "system" ? `
@media (prefers-color-scheme: dark) {
  :host {
    color-scheme: only dark;

    ${getThemedCssVariables({ ...DEFAULT_DARK, ...themeDark })}
  }
}` : ""}
`;
  if (styleNonce) {
    style.setAttribute("nonce", styleNonce);
  }
  return style;
}
const buildFeedbackIntegration = ({
  lazyLoadIntegration: lazyLoadIntegration2,
  getModalIntegration,
  getScreenshotIntegration
}) => {
  const feedbackIntegration = (({
    // FeedbackGeneralConfiguration
    id = "sentry-feedback",
    autoInject = true,
    showBranding = true,
    isEmailRequired = false,
    isNameRequired = false,
    showEmail = true,
    showName = true,
    enableScreenshot = true,
    useSentryUser = {
      email: "email",
      name: "username"
    },
    tags,
    styleNonce,
    scriptNonce,
    // FeedbackThemeConfiguration
    colorScheme = "system",
    themeLight = {},
    themeDark = {},
    // FeedbackTextConfiguration
    addScreenshotButtonLabel = ADD_SCREENSHOT_LABEL,
    cancelButtonLabel = CANCEL_BUTTON_LABEL,
    confirmButtonLabel = CONFIRM_BUTTON_LABEL,
    emailLabel = EMAIL_LABEL,
    emailPlaceholder = EMAIL_PLACEHOLDER,
    formTitle = FORM_TITLE,
    isRequiredLabel = IS_REQUIRED_LABEL,
    messageLabel = MESSAGE_LABEL,
    messagePlaceholder = MESSAGE_PLACEHOLDER,
    nameLabel = NAME_LABEL,
    namePlaceholder = NAME_PLACEHOLDER,
    removeScreenshotButtonLabel = REMOVE_SCREENSHOT_LABEL,
    submitButtonLabel = SUBMIT_BUTTON_LABEL,
    successMessageText = SUCCESS_MESSAGE_TEXT,
    triggerLabel = TRIGGER_LABEL,
    triggerAriaLabel = "",
    highlightToolText = HIGHLIGHT_TOOL_TEXT,
    hideToolText = HIDE_TOOL_TEXT,
    removeHighlightText = REMOVE_HIGHLIGHT_TEXT,
    errorEmptyMessageText = ERROR_EMPTY_MESSAGE_TEXT,
    errorNoClientText = ERROR_NO_CLIENT_TEXT,
    errorTimeoutText = ERROR_TIMEOUT_TEXT,
    errorForbiddenText = ERROR_FORBIDDEN_TEXT,
    errorGenericText = ERROR_GENERIC_TEXT,
    // FeedbackCallbacks
    onFormOpen,
    onFormClose,
    onSubmitSuccess,
    onSubmitError,
    onFormSubmitted
  } = {}) => {
    const _options = {
      id,
      autoInject,
      showBranding,
      isEmailRequired,
      isNameRequired,
      showEmail,
      showName,
      enableScreenshot,
      useSentryUser,
      tags,
      styleNonce,
      scriptNonce,
      colorScheme,
      themeDark,
      themeLight,
      triggerLabel,
      triggerAriaLabel,
      cancelButtonLabel,
      submitButtonLabel,
      confirmButtonLabel,
      formTitle,
      emailLabel,
      emailPlaceholder,
      messageLabel,
      messagePlaceholder,
      nameLabel,
      namePlaceholder,
      successMessageText,
      isRequiredLabel,
      addScreenshotButtonLabel,
      removeScreenshotButtonLabel,
      highlightToolText,
      hideToolText,
      removeHighlightText,
      errorEmptyMessageText,
      errorNoClientText,
      errorTimeoutText,
      errorForbiddenText,
      errorGenericText,
      onFormClose,
      onFormOpen,
      onSubmitError,
      onSubmitSuccess,
      onFormSubmitted
    };
    let _shadow = null;
    let _mainStyle = null;
    let _subscriptions = [];
    const _createShadow = (options) => {
      if (!_shadow) {
        const host = DOCUMENT.createElement("div");
        host.id = String(options.id);
        DOCUMENT.body.appendChild(host);
        _shadow = host.attachShadow({ mode: "open" });
        _mainStyle = createMainStyles(options);
        _shadow.appendChild(_mainStyle);
      }
      return _shadow;
    };
    const _loadAndRenderDialog = async (options) => {
      const screenshotRequired = options.enableScreenshot && isScreenshotSupported();
      let modalIntegration;
      let screenshotIntegration;
      try {
        const modalIntegrationFn = getModalIntegration ? getModalIntegration() : await lazyLoadIntegration2("feedbackModalIntegration", scriptNonce);
        modalIntegration = modalIntegrationFn();
        addIntegration(modalIntegration);
      } catch {
        DEBUG_BUILD$4 && debug$2.error(
          "[Feedback] Error when trying to load feedback integrations. Try using `feedbackSyncIntegration` in your `Sentry.init`."
        );
        throw new Error("[Feedback] Missing feedback modal integration!");
      }
      try {
        const screenshotIntegrationFn = screenshotRequired ? getScreenshotIntegration ? getScreenshotIntegration() : await lazyLoadIntegration2("feedbackScreenshotIntegration", scriptNonce) : void 0;
        if (screenshotIntegrationFn) {
          screenshotIntegration = screenshotIntegrationFn();
          addIntegration(screenshotIntegration);
        }
      } catch {
        DEBUG_BUILD$4 && debug$2.error("[Feedback] Missing feedback screenshot integration. Proceeding without screenshots.");
      }
      const errorMessages = {
        ERROR_EMPTY_MESSAGE: options.errorEmptyMessageText,
        ERROR_NO_CLIENT: options.errorNoClientText,
        ERROR_TIMEOUT: options.errorTimeoutText,
        ERROR_FORBIDDEN: options.errorForbiddenText,
        ERROR_GENERIC: options.errorGenericText
      };
      const wrappedSendFeedback = (params, hint) => sendFeedback(params, { includeReplay: true, ...hint, errorMessages });
      const dialog = modalIntegration.createDialog({
        options: {
          ...options,
          onFormClose: () => {
            dialog?.close();
            options.onFormClose?.();
          },
          onFormSubmitted: () => {
            dialog?.close();
            options.onFormSubmitted?.();
          }
        },
        screenshotIntegration,
        sendFeedback: wrappedSendFeedback,
        shadow: _createShadow(options)
      });
      return dialog;
    };
    const _attachTo = (el, optionOverrides = {}) => {
      const mergedOptions = mergeOptions(_options, optionOverrides);
      const targetEl = typeof el === "string" ? DOCUMENT.querySelector(el) : typeof el.addEventListener === "function" ? el : null;
      if (!targetEl) {
        DEBUG_BUILD$4 && debug$2.error("[Feedback] Unable to attach to target element");
        throw new Error("Unable to attach to target element");
      }
      let dialog = null;
      const handleClick2 = async () => {
        if (!dialog) {
          dialog = await _loadAndRenderDialog({
            ...mergedOptions,
            onFormSubmitted: () => {
              dialog?.removeFromDom();
              mergedOptions.onFormSubmitted?.();
            }
          });
        }
        dialog.appendToDom();
        dialog.open();
      };
      targetEl.addEventListener("click", handleClick2);
      const unsubscribe = () => {
        _subscriptions = _subscriptions.filter((sub) => sub !== unsubscribe);
        dialog?.removeFromDom();
        dialog = null;
        targetEl.removeEventListener("click", handleClick2);
      };
      _subscriptions.push(unsubscribe);
      return unsubscribe;
    };
    const _createActor = (optionOverrides = {}) => {
      const mergedOptions = mergeOptions(_options, optionOverrides);
      const shadow = _createShadow(mergedOptions);
      const actor = Actor({
        triggerLabel: mergedOptions.triggerLabel,
        triggerAriaLabel: mergedOptions.triggerAriaLabel,
        shadow,
        styleNonce
      });
      _attachTo(actor.el, {
        ...mergedOptions,
        onFormOpen() {
          actor.hide();
        },
        onFormClose() {
          actor.show();
        },
        onFormSubmitted() {
          actor.show();
        }
      });
      return actor;
    };
    return {
      name: "Feedback",
      setupOnce() {
        if (!isBrowser() || !_options.autoInject) {
          return;
        }
        if (DOCUMENT.readyState === "loading") {
          DOCUMENT.addEventListener("DOMContentLoaded", () => _createActor().appendToDom());
        } else {
          _createActor().appendToDom();
        }
      },
      /**
       * Adds click listener to the element to open a feedback dialog
       *
       * The returned function can be used to remove the click listener
       */
      attachTo: _attachTo,
      /**
       * Creates a new widget which is composed of a Button which triggers a Dialog.
       * Accepts partial options to override any options passed to constructor.
       */
      createWidget(optionOverrides = {}) {
        const actor = _createActor(mergeOptions(_options, optionOverrides));
        actor.appendToDom();
        return actor;
      },
      /**
       * Creates a new Form which you can
       * Accepts partial options to override any options passed to constructor.
       */
      async createForm(optionOverrides = {}) {
        return _loadAndRenderDialog(mergeOptions(_options, optionOverrides));
      },
      /**
       * Updates the color scheme of the feedback widget at runtime.
       */
      setTheme(colorScheme2) {
        _options.colorScheme = colorScheme2;
        if (_shadow) {
          const newStyle = createMainStyles(_options);
          if (_mainStyle) {
            _shadow.replaceChild(newStyle, _mainStyle);
          } else {
            _shadow.prepend(newStyle);
          }
          _mainStyle = newStyle;
        }
      },
      /**
       * Removes the Feedback integration (including host, shadow DOM, and all widgets)
       */
      remove() {
        if (_shadow) {
          _shadow.parentElement?.remove();
          _shadow = null;
          _mainStyle = null;
        }
        _subscriptions.forEach((sub) => sub());
        _subscriptions = [];
      }
    };
  });
  return feedbackIntegration;
};
function getFeedback() {
  const client = getClient();
  return client?.getIntegrationByName("Feedback");
}
var n$2, l$1, u$1, i$1$1, o$1, r$1$1, f$1, c$1 = {}, s$1 = [], a$1 = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i, h$1 = Array.isArray;
function v$1(n2, l2) {
  for (var u2 in l2) n2[u2] = l2[u2];
  return n2;
}
function p$1(n2) {
  var l2 = n2.parentNode;
  l2 && l2.removeChild(n2);
}
function y$1(l2, u2, t2) {
  var i, o2, r2, f2 = {};
  for (r2 in u2) "key" == r2 ? i = u2[r2] : "ref" == r2 ? o2 = u2[r2] : f2[r2] = u2[r2];
  if (arguments.length > 2 && (f2.children = arguments.length > 3 ? n$2.call(arguments, 2) : t2), "function" == typeof l2 && null != l2.defaultProps) for (r2 in l2.defaultProps) void 0 === f2[r2] && (f2[r2] = l2.defaultProps[r2]);
  return d$1(l2, f2, i, o2, null);
}
function d$1(n2, t2, i, o2, r2) {
  var f2 = { type: n2, props: t2, key: i, ref: o2, __k: null, __: null, __b: 0, __e: null, __d: void 0, __c: null, constructor: void 0, __v: null == r2 ? ++u$1 : r2, __i: -1, __u: 0 };
  return null == r2 && null != l$1.vnode && l$1.vnode(f2), f2;
}
function g$1(n2) {
  return n2.children;
}
function b$1(n2, l2) {
  this.props = n2, this.context = l2;
}
function m$1(n2, l2) {
  if (null == l2) return n2.__ ? m$1(n2.__, n2.__i + 1) : null;
  for (var u2; l2 < n2.__k.length; l2++) if (null != (u2 = n2.__k[l2]) && null != u2.__e) return u2.__e;
  return "function" == typeof n2.type ? m$1(n2) : null;
}
function w$1(n2, u2, t2) {
  var i, o2 = n2.__v, r2 = o2.__e, f2 = n2.__P;
  if (f2) return (i = v$1({}, o2)).__v = o2.__v + 1, l$1.vnode && l$1.vnode(i), M(f2, i, o2, n2.__n, void 0 !== f2.ownerSVGElement, 32 & o2.__u ? [r2] : null, u2, null == r2 ? m$1(o2) : r2, !!(32 & o2.__u), t2), i.__.__k[i.__i] = i, i.__d = void 0, i.__e != r2 && k$1(i), i;
}
function k$1(n2) {
  var l2, u2;
  if (null != (n2 = n2.__) && null != n2.__c) {
    for (n2.__e = n2.__c.base = null, l2 = 0; l2 < n2.__k.length; l2++) if (null != (u2 = n2.__k[l2]) && null != u2.__e) {
      n2.__e = n2.__c.base = u2.__e;
      break;
    }
    return k$1(n2);
  }
}
function x$1(n2) {
  (!n2.__d && (n2.__d = true) && i$1$1.push(n2) && !C$1.__r++ || o$1 !== l$1.debounceRendering) && ((o$1 = l$1.debounceRendering) || r$1$1)(C$1);
}
function C$1() {
  var n2, u2, t2, o2 = [], r2 = [];
  for (i$1$1.sort(f$1); n2 = i$1$1.shift(); ) n2.__d && (t2 = i$1$1.length, u2 = w$1(n2, o2, r2) || u2, 0 === t2 || i$1$1.length > t2 ? (j$1(o2, u2, r2), r2.length = o2.length = 0, u2 = void 0, i$1$1.sort(f$1)) : u2 && l$1.__c && l$1.__c(u2, s$1));
  u2 && j$1(o2, u2, r2), C$1.__r = 0;
}
function P$1(n2, l2, u2, t2, i, o2, r2, f2, e2, a2, h2) {
  var v2, p2, y2, d2, _2, g2 = t2 && t2.__k || s$1, b2 = l2.length;
  for (u2.__d = e2, S(u2, l2, g2), e2 = u2.__d, v2 = 0; v2 < b2; v2++) null != (y2 = u2.__k[v2]) && "boolean" != typeof y2 && "function" != typeof y2 && (p2 = -1 === y2.__i ? c$1 : g2[y2.__i] || c$1, y2.__i = v2, M(n2, y2, p2, i, o2, r2, f2, e2, a2, h2), d2 = y2.__e, y2.ref && p2.ref != y2.ref && (p2.ref && N(p2.ref, null, y2), h2.push(y2.ref, y2.__c || d2, y2)), null == _2 && null != d2 && (_2 = d2), 65536 & y2.__u || p2.__k === y2.__k ? e2 = $(y2, e2, n2) : "function" == typeof y2.type && void 0 !== y2.__d ? e2 = y2.__d : d2 && (e2 = d2.nextSibling), y2.__d = void 0, y2.__u &= -196609);
  u2.__d = e2, u2.__e = _2;
}
function S(n2, l2, u2) {
  var t2, i, o2, r2, f2, e2 = l2.length, c2 = u2.length, s2 = c2, a2 = 0;
  for (n2.__k = [], t2 = 0; t2 < e2; t2++) null != (i = n2.__k[t2] = null == (i = l2[t2]) || "boolean" == typeof i || "function" == typeof i ? null : "string" == typeof i || "number" == typeof i || "bigint" == typeof i || i.constructor == String ? d$1(null, i, null, null, i) : h$1(i) ? d$1(g$1, { children: i }, null, null, null) : void 0 === i.constructor && i.__b > 0 ? d$1(i.type, i.props, i.key, i.ref ? i.ref : null, i.__v) : i) ? (i.__ = n2, i.__b = n2.__b + 1, f2 = I(i, u2, r2 = t2 + a2, s2), i.__i = f2, o2 = null, -1 !== f2 && (s2--, (o2 = u2[f2]) && (o2.__u |= 131072)), null == o2 || null === o2.__v ? (-1 == f2 && a2--, "function" != typeof i.type && (i.__u |= 65536)) : f2 !== r2 && (f2 === r2 + 1 ? a2++ : f2 > r2 ? s2 > e2 - r2 ? a2 += f2 - r2 : a2-- : a2 = f2 < r2 && f2 == r2 - 1 ? f2 - r2 : 0, f2 !== t2 + a2 && (i.__u |= 65536))) : (o2 = u2[t2]) && null == o2.key && o2.__e && (o2.__e == n2.__d && (n2.__d = m$1(o2)), O(o2, o2, false), u2[t2] = null, s2--);
  if (s2) for (t2 = 0; t2 < c2; t2++) null != (o2 = u2[t2]) && 0 == (131072 & o2.__u) && (o2.__e == n2.__d && (n2.__d = m$1(o2)), O(o2, o2));
}
function $(n2, l2, u2) {
  var t2, i;
  if ("function" == typeof n2.type) {
    for (t2 = n2.__k, i = 0; t2 && i < t2.length; i++) t2[i] && (t2[i].__ = n2, l2 = $(t2[i], l2, u2));
    return l2;
  }
  n2.__e != l2 && (u2.insertBefore(n2.__e, l2 || null), l2 = n2.__e);
  do {
    l2 = l2 && l2.nextSibling;
  } while (null != l2 && 8 === l2.nodeType);
  return l2;
}
function I(n2, l2, u2, t2) {
  var i = n2.key, o2 = n2.type, r2 = u2 - 1, f2 = u2 + 1, e2 = l2[u2];
  if (null === e2 || e2 && i == e2.key && o2 === e2.type) return u2;
  if (t2 > (null != e2 && 0 == (131072 & e2.__u) ? 1 : 0)) for (; r2 >= 0 || f2 < l2.length; ) {
    if (r2 >= 0) {
      if ((e2 = l2[r2]) && 0 == (131072 & e2.__u) && i == e2.key && o2 === e2.type) return r2;
      r2--;
    }
    if (f2 < l2.length) {
      if ((e2 = l2[f2]) && 0 == (131072 & e2.__u) && i == e2.key && o2 === e2.type) return f2;
      f2++;
    }
  }
  return -1;
}
function T$1(n2, l2, u2) {
  "-" === l2[0] ? n2.setProperty(l2, null == u2 ? "" : u2) : n2[l2] = null == u2 ? "" : "number" != typeof u2 || a$1.test(l2) ? u2 : u2 + "px";
}
function A$1(n2, l2, u2, t2, i) {
  var o2;
  n: if ("style" === l2) if ("string" == typeof u2) n2.style.cssText = u2;
  else {
    if ("string" == typeof t2 && (n2.style.cssText = t2 = ""), t2) for (l2 in t2) u2 && l2 in u2 || T$1(n2.style, l2, "");
    if (u2) for (l2 in u2) t2 && u2[l2] === t2[l2] || T$1(n2.style, l2, u2[l2]);
  }
  else if ("o" === l2[0] && "n" === l2[1]) o2 = l2 !== (l2 = l2.replace(/(PointerCapture)$|Capture$/i, "$1")), l2 = l2.toLowerCase() in n2 ? l2.toLowerCase().slice(2) : l2.slice(2), n2.l || (n2.l = {}), n2.l[l2 + o2] = u2, u2 ? t2 ? u2.u = t2.u : (u2.u = Date.now(), n2.addEventListener(l2, o2 ? L : D$1, o2)) : n2.removeEventListener(l2, o2 ? L : D$1, o2);
  else {
    if (i) l2 = l2.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
    else if ("width" !== l2 && "height" !== l2 && "href" !== l2 && "list" !== l2 && "form" !== l2 && "tabIndex" !== l2 && "download" !== l2 && "rowSpan" !== l2 && "colSpan" !== l2 && "role" !== l2 && l2 in n2) try {
      n2[l2] = null == u2 ? "" : u2;
      break n;
    } catch (n3) {
    }
    "function" == typeof u2 || (null == u2 || false === u2 && "-" !== l2[4] ? n2.removeAttribute(l2) : n2.setAttribute(l2, u2));
  }
}
function D$1(n2) {
  if (this.l) {
    var u2 = this.l[n2.type + false];
    if (n2.t) {
      if (n2.t <= u2.u) return;
    } else n2.t = Date.now();
    return u2(l$1.event ? l$1.event(n2) : n2);
  }
}
function L(n2) {
  if (this.l) return this.l[n2.type + true](l$1.event ? l$1.event(n2) : n2);
}
function M(n2, u2, t2, i, o2, r2, f2, e2, c2, s2) {
  var a2, p2, y2, d2, _2, m2, w2, k2, x2, C2, S2, $2, H, I2, T2, A2 = u2.type;
  if (void 0 !== u2.constructor) return null;
  128 & t2.__u && (c2 = !!(32 & t2.__u), r2 = [e2 = u2.__e = t2.__e]), (a2 = l$1.__b) && a2(u2);
  n: if ("function" == typeof A2) try {
    if (k2 = u2.props, x2 = (a2 = A2.contextType) && i[a2.__c], C2 = a2 ? x2 ? x2.props.value : a2.__ : i, t2.__c ? w2 = (p2 = u2.__c = t2.__c).__ = p2.__E : ("prototype" in A2 && A2.prototype.render ? u2.__c = p2 = new A2(k2, C2) : (u2.__c = p2 = new b$1(k2, C2), p2.constructor = A2, p2.render = q$1), x2 && x2.sub(p2), p2.props = k2, p2.state || (p2.state = {}), p2.context = C2, p2.__n = i, y2 = p2.__d = true, p2.__h = [], p2._sb = []), null == p2.__s && (p2.__s = p2.state), null != A2.getDerivedStateFromProps && (p2.__s == p2.state && (p2.__s = v$1({}, p2.__s)), v$1(p2.__s, A2.getDerivedStateFromProps(k2, p2.__s))), d2 = p2.props, _2 = p2.state, p2.__v = u2, y2) null == A2.getDerivedStateFromProps && null != p2.componentWillMount && p2.componentWillMount(), null != p2.componentDidMount && p2.__h.push(p2.componentDidMount);
    else {
      if (null == A2.getDerivedStateFromProps && k2 !== d2 && null != p2.componentWillReceiveProps && p2.componentWillReceiveProps(k2, C2), !p2.__e && (null != p2.shouldComponentUpdate && false === p2.shouldComponentUpdate(k2, p2.__s, C2) || u2.__v === t2.__v)) {
        for (u2.__v !== t2.__v && (p2.props = k2, p2.state = p2.__s, p2.__d = false), u2.__e = t2.__e, u2.__k = t2.__k, u2.__k.forEach(function(n3) {
          n3 && (n3.__ = u2);
        }), S2 = 0; S2 < p2._sb.length; S2++) p2.__h.push(p2._sb[S2]);
        p2._sb = [], p2.__h.length && f2.push(p2);
        break n;
      }
      null != p2.componentWillUpdate && p2.componentWillUpdate(k2, p2.__s, C2), null != p2.componentDidUpdate && p2.__h.push(function() {
        p2.componentDidUpdate(d2, _2, m2);
      });
    }
    if (p2.context = C2, p2.props = k2, p2.__P = n2, p2.__e = false, $2 = l$1.__r, H = 0, "prototype" in A2 && A2.prototype.render) {
      for (p2.state = p2.__s, p2.__d = false, $2 && $2(u2), a2 = p2.render(p2.props, p2.state, p2.context), I2 = 0; I2 < p2._sb.length; I2++) p2.__h.push(p2._sb[I2]);
      p2._sb = [];
    } else do {
      p2.__d = false, $2 && $2(u2), a2 = p2.render(p2.props, p2.state, p2.context), p2.state = p2.__s;
    } while (p2.__d && ++H < 25);
    p2.state = p2.__s, null != p2.getChildContext && (i = v$1(v$1({}, i), p2.getChildContext())), y2 || null == p2.getSnapshotBeforeUpdate || (m2 = p2.getSnapshotBeforeUpdate(d2, _2)), P$1(n2, h$1(T2 = null != a2 && a2.type === g$1 && null == a2.key ? a2.props.children : a2) ? T2 : [T2], u2, t2, i, o2, r2, f2, e2, c2, s2), p2.base = u2.__e, u2.__u &= -161, p2.__h.length && f2.push(p2), w2 && (p2.__E = p2.__ = null);
  } catch (n3) {
    u2.__v = null, c2 || null != r2 ? (u2.__e = e2, u2.__u |= c2 ? 160 : 32, r2[r2.indexOf(e2)] = null) : (u2.__e = t2.__e, u2.__k = t2.__k), l$1.__e(n3, u2, t2);
  }
  else null == r2 && u2.__v === t2.__v ? (u2.__k = t2.__k, u2.__e = t2.__e) : u2.__e = z$1(t2.__e, u2, t2, i, o2, r2, f2, c2, s2);
  (a2 = l$1.diffed) && a2(u2);
}
function j$1(n2, u2, t2) {
  for (var i = 0; i < t2.length; i++) N(t2[i], t2[++i], t2[++i]);
  l$1.__c && l$1.__c(u2, n2), n2.some(function(u3) {
    try {
      n2 = u3.__h, u3.__h = [], n2.some(function(n3) {
        n3.call(u3);
      });
    } catch (n3) {
      l$1.__e(n3, u3.__v);
    }
  });
}
function z$1(l2, u2, t2, i, o2, r2, f2, e2, s2) {
  var a2, v2, y2, d2, _2, g2, b2, w2 = t2.props, k2 = u2.props, x2 = u2.type;
  if ("svg" === x2 && (o2 = true), null != r2) {
    for (a2 = 0; a2 < r2.length; a2++) if ((_2 = r2[a2]) && "setAttribute" in _2 == !!x2 && (x2 ? _2.localName === x2 : 3 === _2.nodeType)) {
      l2 = _2, r2[a2] = null;
      break;
    }
  }
  if (null == l2) {
    if (null === x2) return document.createTextNode(k2);
    l2 = o2 ? document.createElementNS("http://www.w3.org/2000/svg", x2) : document.createElement(x2, k2.is && k2), r2 = null, e2 = false;
  }
  if (null === x2) w2 === k2 || e2 && l2.data === k2 || (l2.data = k2);
  else {
    if (r2 = r2 && n$2.call(l2.childNodes), w2 = t2.props || c$1, !e2 && null != r2) for (w2 = {}, a2 = 0; a2 < l2.attributes.length; a2++) w2[(_2 = l2.attributes[a2]).name] = _2.value;
    for (a2 in w2) _2 = w2[a2], "children" == a2 || ("dangerouslySetInnerHTML" == a2 ? y2 = _2 : "key" === a2 || a2 in k2 || A$1(l2, a2, null, _2, o2));
    for (a2 in k2) _2 = k2[a2], "children" == a2 ? d2 = _2 : "dangerouslySetInnerHTML" == a2 ? v2 = _2 : "value" == a2 ? g2 = _2 : "checked" == a2 ? b2 = _2 : "key" === a2 || e2 && "function" != typeof _2 || w2[a2] === _2 || A$1(l2, a2, _2, w2[a2], o2);
    if (v2) e2 || y2 && (v2.__html === y2.__html || v2.__html === l2.innerHTML) || (l2.innerHTML = v2.__html), u2.__k = [];
    else if (y2 && (l2.innerHTML = ""), P$1(l2, h$1(d2) ? d2 : [d2], u2, t2, i, o2 && "foreignObject" !== x2, r2, f2, r2 ? r2[0] : t2.__k && m$1(t2, 0), e2, s2), null != r2) for (a2 = r2.length; a2--; ) null != r2[a2] && p$1(r2[a2]);
    e2 || (a2 = "value", void 0 !== g2 && (g2 !== l2[a2] || "progress" === x2 && !g2 || "option" === x2 && g2 !== w2[a2]) && A$1(l2, a2, g2, w2[a2], false), a2 = "checked", void 0 !== b2 && b2 !== l2[a2] && A$1(l2, a2, b2, w2[a2], false));
  }
  return l2;
}
function N(n2, u2, t2) {
  try {
    "function" == typeof n2 ? n2(u2) : n2.current = u2;
  } catch (n3) {
    l$1.__e(n3, t2);
  }
}
function O(n2, u2, t2) {
  var i, o2;
  if (l$1.unmount && l$1.unmount(n2), (i = n2.ref) && (i.current && i.current !== n2.__e || N(i, null, u2)), null != (i = n2.__c)) {
    if (i.componentWillUnmount) try {
      i.componentWillUnmount();
    } catch (n3) {
      l$1.__e(n3, u2);
    }
    i.base = i.__P = null, n2.__c = void 0;
  }
  if (i = n2.__k) for (o2 = 0; o2 < i.length; o2++) i[o2] && O(i[o2], u2, t2 || "function" != typeof n2.type);
  t2 || null == n2.__e || p$1(n2.__e), n2.__ = n2.__e = n2.__d = void 0;
}
function q$1(n2, l2, u2) {
  return this.constructor(n2, u2);
}
function B$1(u2, t2, i) {
  var o2, r2, f2, e2;
  l$1.__ && l$1.__(u2, t2), r2 = (o2 = false) ? null : t2.__k, f2 = [], e2 = [], M(t2, u2 = t2.__k = y$1(g$1, null, [u2]), r2 || c$1, c$1, void 0 !== t2.ownerSVGElement, r2 ? null : t2.firstChild ? n$2.call(t2.childNodes) : null, f2, r2 ? r2.__e : t2.firstChild, o2, e2), u2.__d = void 0, j$1(f2, u2, e2);
}
n$2 = s$1.slice, l$1 = { __e: function(n2, l2, u2, t2) {
  for (var i, o2, r2; l2 = l2.__; ) if ((i = l2.__c) && !i.__) try {
    if ((o2 = i.constructor) && null != o2.getDerivedStateFromError && (i.setState(o2.getDerivedStateFromError(n2)), r2 = i.__d), null != i.componentDidCatch && (i.componentDidCatch(n2, t2 || {}), r2 = i.__d), r2) return i.__E = i;
  } catch (l3) {
    n2 = l3;
  }
  throw n2;
} }, u$1 = 0, b$1.prototype.setState = function(n2, l2) {
  var u2;
  u2 = null != this.__s && this.__s !== this.state ? this.__s : this.__s = v$1({}, this.state), "function" == typeof n2 && (n2 = n2(v$1({}, u2), this.props)), n2 && v$1(u2, n2), null != n2 && this.__v && (l2 && this._sb.push(l2), x$1(this));
}, b$1.prototype.forceUpdate = function(n2) {
  this.__v && (this.__e = true, n2 && this.__h.push(n2), x$1(this));
}, b$1.prototype.render = g$1, i$1$1 = [], r$1$1 = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, f$1 = function(n2, l2) {
  return n2.__v.__b - l2.__v.__b;
}, C$1.__r = 0;
var t$1, r$2, u, i$2, o = 0, f = [], c = [], e$1 = l$1, a = e$1.__b, v = e$1.__r, l = e$1.diffed, m = e$1.__c, s = e$1.unmount, d = e$1.__;
function h(n2, t2) {
  e$1.__h && e$1.__h(r$2, n2, o || t2), o = 0;
  var u2 = r$2.__H || (r$2.__H = { __: [], __h: [] });
  return n2 >= u2.__.length && u2.__.push({ __V: c }), u2.__[n2];
}
function p(n2) {
  return o = 1, y(D, n2);
}
function y(n2, u2, i) {
  var o2 = h(t$1++, 2);
  if (o2.t = n2, !o2.__c && (o2.__ = [i ? i(u2) : D(void 0, u2), function(n3) {
    var t2 = o2.__N ? o2.__N[0] : o2.__[0], r2 = o2.t(t2, n3);
    t2 !== r2 && (o2.__N = [r2, o2.__[1]], o2.__c.setState({}));
  }], o2.__c = r$2, !r$2.u)) {
    var f2 = function(n3, t2, r2) {
      if (!o2.__c.__H) return true;
      var u3 = o2.__c.__H.__.filter(function(n4) {
        return !!n4.__c;
      });
      if (u3.every(function(n4) {
        return !n4.__N;
      })) return !c2 || c2.call(this, n3, t2, r2);
      var i2 = false;
      return u3.forEach(function(n4) {
        if (n4.__N) {
          var t3 = n4.__[0];
          n4.__ = n4.__N, n4.__N = void 0, t3 !== n4.__[0] && (i2 = true);
        }
      }), !(!i2 && o2.__c.props === n3) && (!c2 || c2.call(this, n3, t2, r2));
    };
    r$2.u = true;
    var c2 = r$2.shouldComponentUpdate, e2 = r$2.componentWillUpdate;
    r$2.componentWillUpdate = function(n3, t2, r2) {
      if (this.__e) {
        var u3 = c2;
        c2 = void 0, f2(n3, t2, r2), c2 = u3;
      }
      e2 && e2.call(this, n3, t2, r2);
    }, r$2.shouldComponentUpdate = f2;
  }
  return o2.__N || o2.__;
}
function _(n2, u2) {
  var i = h(t$1++, 3);
  !e$1.__s && C(i.__H, u2) && (i.__ = n2, i.i = u2, r$2.__H.__h.push(i));
}
function A(n2, u2) {
  var i = h(t$1++, 4);
  !e$1.__s && C(i.__H, u2) && (i.__ = n2, i.i = u2, r$2.__h.push(i));
}
function F(n2) {
  return o = 5, q(function() {
    return { current: n2 };
  }, []);
}
function T(n2, t2, r2) {
  o = 6, A(function() {
    return "function" == typeof n2 ? (n2(t2()), function() {
      return n2(null);
    }) : n2 ? (n2.current = t2(), function() {
      return n2.current = null;
    }) : void 0;
  }, null == r2 ? r2 : r2.concat(n2));
}
function q(n2, r2) {
  var u2 = h(t$1++, 7);
  return C(u2.__H, r2) ? (u2.__V = n2(), u2.i = r2, u2.__h = n2, u2.__V) : u2.__;
}
function x(n2, t2) {
  return o = 8, q(function() {
    return n2;
  }, t2);
}
function P(n2) {
  var u2 = r$2.context[n2.__c], i = h(t$1++, 9);
  return i.c = n2, u2 ? (null == i.__ && (i.__ = true, u2.sub(r$2)), u2.props.value) : n2.__;
}
function V(n2, t2) {
  e$1.useDebugValue && e$1.useDebugValue(t2 ? t2(n2) : n2);
}
function b(n2) {
  var u2 = h(t$1++, 10), i = p();
  return u2.__ = n2, r$2.componentDidCatch || (r$2.componentDidCatch = function(n3, t2) {
    u2.__ && u2.__(n3, t2), i[1](n3);
  }), [i[0], function() {
    i[1](void 0);
  }];
}
function g() {
  var n2 = h(t$1++, 11);
  if (!n2.__) {
    for (var u2 = r$2.__v; null !== u2 && !u2.__m && null !== u2.__; ) u2 = u2.__;
    var i = u2.__m || (u2.__m = [0, 0]);
    n2.__ = "P" + i[0] + "-" + i[1]++;
  }
  return n2.__;
}
function j() {
  for (var n2; n2 = f.shift(); ) if (n2.__P && n2.__H) try {
    n2.__H.__h.forEach(z), n2.__H.__h.forEach(B), n2.__H.__h = [];
  } catch (t2) {
    n2.__H.__h = [], e$1.__e(t2, n2.__v);
  }
}
e$1.__b = function(n2) {
  r$2 = null, a && a(n2);
}, e$1.__ = function(n2, t2) {
  t2.__k && t2.__k.__m && (n2.__m = t2.__k.__m), d && d(n2, t2);
}, e$1.__r = function(n2) {
  v && v(n2), t$1 = 0;
  var i = (r$2 = n2.__c).__H;
  i && (u === r$2 ? (i.__h = [], r$2.__h = [], i.__.forEach(function(n3) {
    n3.__N && (n3.__ = n3.__N), n3.__V = c, n3.__N = n3.i = void 0;
  })) : (i.__h.forEach(z), i.__h.forEach(B), i.__h = [], t$1 = 0)), u = r$2;
}, e$1.diffed = function(n2) {
  l && l(n2);
  var t2 = n2.__c;
  t2 && t2.__H && (t2.__H.__h.length && (1 !== f.push(t2) && i$2 === e$1.requestAnimationFrame || ((i$2 = e$1.requestAnimationFrame) || w)(j)), t2.__H.__.forEach(function(n3) {
    n3.i && (n3.__H = n3.i), n3.__V !== c && (n3.__ = n3.__V), n3.i = void 0, n3.__V = c;
  })), u = r$2 = null;
}, e$1.__c = function(n2, t2) {
  t2.some(function(n3) {
    try {
      n3.__h.forEach(z), n3.__h = n3.__h.filter(function(n4) {
        return !n4.__ || B(n4);
      });
    } catch (r2) {
      t2.some(function(n4) {
        n4.__h && (n4.__h = []);
      }), t2 = [], e$1.__e(r2, n3.__v);
    }
  }), m && m(n2, t2);
}, e$1.unmount = function(n2) {
  s && s(n2);
  var t2, r2 = n2.__c;
  r2 && r2.__H && (r2.__H.__.forEach(function(n3) {
    try {
      z(n3);
    } catch (n4) {
      t2 = n4;
    }
  }), r2.__H = void 0, t2 && e$1.__e(t2, r2.__v));
};
var k = "function" == typeof requestAnimationFrame;
function w(n2) {
  var t2, r2 = function() {
    clearTimeout(u2), k && cancelAnimationFrame(t2), setTimeout(n2);
  }, u2 = setTimeout(r2, 100);
  k && (t2 = requestAnimationFrame(r2));
}
function z(n2) {
  var t2 = r$2, u2 = n2.__c;
  "function" == typeof u2 && (n2.__c = void 0, u2()), r$2 = t2;
}
function B(n2) {
  var t2 = r$2;
  n2.__c = n2.__(), r$2 = t2;
}
function C(n2, t2) {
  return !n2 || n2.length !== t2.length || t2.some(function(t3, r2) {
    return t3 !== n2[r2];
  });
}
function D(n2, t2) {
  return "function" == typeof t2 ? t2(n2) : t2;
}
const hooks = /* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  useCallback: x,
  useContext: P,
  useDebugValue: V,
  useEffect: _,
  useErrorBoundary: b,
  useId: g,
  useImperativeHandle: T,
  useLayoutEffect: A,
  useMemo: q,
  useReducer: y,
  useRef: F,
  useState: p
}, Symbol.toStringTag, { value: "Module" });
const XMLNS$1 = "http://www.w3.org/2000/svg";
function SentryLogo() {
  const createElementNS = (tagName) => DOCUMENT.createElementNS(XMLNS$1, tagName);
  const svg = setAttributesNS(createElementNS("svg"), {
    width: "32",
    height: "30",
    viewBox: "0 0 72 66",
    fill: "inherit"
  });
  const path = setAttributesNS(createElementNS("path"), {
    transform: "translate(11, 11)",
    d: "M29,2.26a4.67,4.67,0,0,0-8,0L14.42,13.53A32.21,32.21,0,0,1,32.17,40.19H27.55A27.68,27.68,0,0,0,12.09,17.47L6,28a15.92,15.92,0,0,1,9.23,12.17H4.62A.76.76,0,0,1,4,39.06l2.94-5a10.74,10.74,0,0,0-3.36-1.9l-2.91,5a4.54,4.54,0,0,0,1.69,6.24A4.66,4.66,0,0,0,4.62,44H19.15a19.4,19.4,0,0,0-8-17.31l2.31-4A23.87,23.87,0,0,1,23.76,44H36.07a35.88,35.88,0,0,0-16.41-31.8l4.67-8a.77.77,0,0,1,1.05-.27c.53.29,20.29,34.77,20.66,35.17a.76.76,0,0,1-.68,1.13H40.6q.09,1.91,0,3.81h4.78A4.59,4.59,0,0,0,50,39.43a4.49,4.49,0,0,0-.62-2.28Z"
  });
  svg.appendChild(path);
  return svg;
}
function DialogHeader({ options }) {
  const logoHtml = q(() => ({ __html: SentryLogo().outerHTML }), []);
  return /* @__PURE__ */ y$1("h2", { class: "dialog__header" }, /* @__PURE__ */ y$1("span", { class: "dialog__title" }, options.formTitle), options.showBranding ? /* @__PURE__ */ y$1(
    "a",
    {
      class: "brand-link",
      target: "_blank",
      href: "https://sentry.io/welcome/",
      title: "Powered by Sentry",
      rel: "noopener noreferrer",
      dangerouslySetInnerHTML: logoHtml
    }
  ) : null);
}
function getMissingFields(feedback, props) {
  const emptyFields = [];
  if (props.isNameRequired && !feedback.name) {
    emptyFields.push(props.nameLabel);
  }
  if (props.isEmailRequired && !feedback.email) {
    emptyFields.push(props.emailLabel);
  }
  if (!feedback.message) {
    emptyFields.push(props.messageLabel);
  }
  return emptyFields;
}
function retrieveStringValue(formData, key) {
  const value = formData.get(key);
  if (typeof value === "string") {
    return value.trim();
  }
  return "";
}
function Form({
  options,
  defaultEmail,
  defaultName,
  onFormClose,
  onSubmit,
  onSubmitSuccess,
  onSubmitError,
  showEmail,
  showName,
  screenshotInput
}) {
  const {
    tags,
    addScreenshotButtonLabel,
    removeScreenshotButtonLabel,
    cancelButtonLabel,
    emailLabel,
    emailPlaceholder,
    isEmailRequired,
    isNameRequired,
    messageLabel,
    messagePlaceholder,
    nameLabel,
    namePlaceholder,
    submitButtonLabel,
    isRequiredLabel
  } = options;
  const [isSubmitting, setIsSubmitting] = p(false);
  const [error2, setError] = p(null);
  const [showScreenshotInput, setShowScreenshotInput] = p(false);
  const ScreenshotInputComponent = screenshotInput?.input;
  const [screenshotError, setScreenshotError] = p(null);
  const onScreenshotError = x((error22) => {
    setScreenshotError(error22);
    setShowScreenshotInput(false);
  }, []);
  const hasAllRequiredFields = x(
    (data) => {
      const missingFields = getMissingFields(data, {
        emailLabel,
        isEmailRequired,
        isNameRequired,
        messageLabel,
        nameLabel
      });
      if (missingFields.length > 0) {
        setError(`Please enter in the following required fields: ${missingFields.join(", ")}`);
      } else {
        setError(null);
      }
      return missingFields.length === 0;
    },
    [emailLabel, isEmailRequired, isNameRequired, messageLabel, nameLabel]
  );
  const handleSubmit = x(
    async (e2) => {
      setIsSubmitting(true);
      try {
        e2.preventDefault();
        if (!(e2.target instanceof HTMLFormElement)) {
          return;
        }
        const formData = new FormData(e2.target);
        const attachment = await (screenshotInput && showScreenshotInput ? screenshotInput.value() : void 0);
        const data = {
          name: retrieveStringValue(formData, "name"),
          email: retrieveStringValue(formData, "email"),
          message: retrieveStringValue(formData, "message"),
          attachments: attachment ? [attachment] : void 0
        };
        if (!hasAllRequiredFields(data)) {
          return;
        }
        try {
          const eventId = await onSubmit(
            {
              name: data.name,
              email: data.email,
              message: data.message,
              source: FEEDBACK_WIDGET_SOURCE,
              tags
            },
            { attachments: data.attachments }
          );
          onSubmitSuccess(data, eventId);
        } catch (error22) {
          DEBUG_BUILD$4 && debug$2.error(error22);
          const err = error22 instanceof Error ? error22 : new Error(String(error22));
          setError(err.message);
          onSubmitError(err);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [screenshotInput && showScreenshotInput, onSubmitSuccess, onSubmitError]
  );
  return /* @__PURE__ */ y$1("form", { class: "form", onSubmit: handleSubmit }, ScreenshotInputComponent && showScreenshotInput ? /* @__PURE__ */ y$1(ScreenshotInputComponent, { onError: onScreenshotError }) : null, /* @__PURE__ */ y$1("fieldset", { class: "form__right", "data-sentry-feedback": true, disabled: isSubmitting }, /* @__PURE__ */ y$1("div", { class: "form__top" }, error2 ? /* @__PURE__ */ y$1("div", { class: "form__error-container" }, error2) : null, showName ? /* @__PURE__ */ y$1("label", { for: "name", class: "form__label" }, /* @__PURE__ */ y$1(LabelText, { label: nameLabel, isRequiredLabel, isRequired: isNameRequired }), /* @__PURE__ */ y$1(
    "input",
    {
      class: "form__input",
      defaultValue: defaultName,
      id: "name",
      name: "name",
      placeholder: namePlaceholder,
      required: isNameRequired,
      type: "text"
    }
  )) : /* @__PURE__ */ y$1("input", { "aria-hidden": true, value: defaultName, name: "name", type: "hidden" }), showEmail ? /* @__PURE__ */ y$1("label", { for: "email", class: "form__label" }, /* @__PURE__ */ y$1(LabelText, { label: emailLabel, isRequiredLabel, isRequired: isEmailRequired }), /* @__PURE__ */ y$1(
    "input",
    {
      class: "form__input",
      defaultValue: defaultEmail,
      id: "email",
      name: "email",
      placeholder: emailPlaceholder,
      required: isEmailRequired,
      type: "email"
    }
  )) : /* @__PURE__ */ y$1("input", { "aria-hidden": true, value: defaultEmail, name: "email", type: "hidden" }), /* @__PURE__ */ y$1("label", { for: "message", class: "form__label" }, /* @__PURE__ */ y$1(LabelText, { label: messageLabel, isRequiredLabel, isRequired: true }), /* @__PURE__ */ y$1(
    "textarea",
    {
      autoFocus: true,
      class: "form__input form__input--textarea",
      id: "message",
      name: "message",
      placeholder: messagePlaceholder,
      required: true,
      rows: 5
    }
  )), ScreenshotInputComponent ? /* @__PURE__ */ y$1("label", { for: "screenshot", class: "form__label" }, /* @__PURE__ */ y$1(
    "button",
    {
      class: "btn btn--default",
      disabled: isSubmitting,
      type: "button",
      onClick: () => {
        setScreenshotError(null);
        setShowScreenshotInput((prev) => !prev);
      }
    },
    showScreenshotInput ? removeScreenshotButtonLabel : addScreenshotButtonLabel
  ), screenshotError ? /* @__PURE__ */ y$1("div", { class: "form__error-container" }, screenshotError.message) : null) : null), /* @__PURE__ */ y$1("div", { class: "btn-group" }, /* @__PURE__ */ y$1("button", { class: "btn btn--primary", disabled: isSubmitting, type: "submit" }, submitButtonLabel), /* @__PURE__ */ y$1("button", { class: "btn btn--default", disabled: isSubmitting, type: "button", onClick: onFormClose }, cancelButtonLabel))));
}
function LabelText({
  label,
  isRequired,
  isRequiredLabel
}) {
  return /* @__PURE__ */ y$1("span", { class: "form__label__text" }, label, isRequired && /* @__PURE__ */ y$1("span", { class: "form__label__text--required" }, isRequiredLabel));
}
const WIDTH = 16;
const HEIGHT = 17;
const XMLNS = "http://www.w3.org/2000/svg";
function SuccessIcon() {
  const createElementNS = (tagName) => WINDOW$5.document.createElementNS(XMLNS, tagName);
  const svg = setAttributesNS(createElementNS("svg"), {
    width: `${WIDTH}`,
    height: `${HEIGHT}`,
    viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
    fill: "inherit"
  });
  const g2 = setAttributesNS(createElementNS("g"), {
    clipPath: "url(#clip0_57_156)"
  });
  const path2 = setAttributesNS(createElementNS("path"), {
    ["fill-rule"]: "evenodd",
    ["clip-rule"]: "evenodd",
    d: "M3.55544 15.1518C4.87103 16.0308 6.41775 16.5 8 16.5C10.1217 16.5 12.1566 15.6571 13.6569 14.1569C15.1571 12.6566 16 10.6217 16 8.5C16 6.91775 15.5308 5.37103 14.6518 4.05544C13.7727 2.73985 12.5233 1.71447 11.0615 1.10897C9.59966 0.503466 7.99113 0.34504 6.43928 0.653721C4.88743 0.962403 3.46197 1.72433 2.34315 2.84315C1.22433 3.96197 0.462403 5.38743 0.153721 6.93928C-0.15496 8.49113 0.00346625 10.0997 0.608967 11.5615C1.21447 13.0233 2.23985 14.2727 3.55544 15.1518ZM4.40546 3.1204C5.46945 2.40946 6.72036 2.03 8 2.03C9.71595 2.03 11.3616 2.71166 12.575 3.92502C13.7883 5.13838 14.47 6.78405 14.47 8.5C14.47 9.77965 14.0905 11.0306 13.3796 12.0945C12.6687 13.1585 11.6582 13.9878 10.476 14.4775C9.29373 14.9672 7.99283 15.0953 6.73777 14.8457C5.48271 14.596 4.32987 13.9798 3.42502 13.075C2.52018 12.1701 1.90397 11.0173 1.65432 9.76224C1.40468 8.50718 1.5328 7.20628 2.0225 6.02404C2.5122 4.8418 3.34148 3.83133 4.40546 3.1204Z"
  });
  const path = setAttributesNS(createElementNS("path"), {
    d: "M6.68775 12.4297C6.78586 12.4745 6.89218 12.4984 7 12.5C7.11275 12.4955 7.22315 12.4664 7.32337 12.4145C7.4236 12.3627 7.51121 12.2894 7.58 12.2L12 5.63999C12.0848 5.47724 12.1071 5.28902 12.0625 5.11098C12.0178 4.93294 11.9095 4.77744 11.7579 4.67392C11.6064 4.57041 11.4221 4.52608 11.24 4.54931C11.0579 4.57254 10.8907 4.66173 10.77 4.79999L6.88 10.57L5.13 8.56999C5.06508 8.49566 4.98613 8.43488 4.89768 8.39111C4.80922 8.34735 4.713 8.32148 4.61453 8.31498C4.51605 8.30847 4.41727 8.32147 4.32382 8.35322C4.23038 8.38497 4.14413 8.43484 4.07 8.49999C3.92511 8.63217 3.83692 8.81523 3.82387 9.01092C3.81083 9.2066 3.87393 9.39976 4 9.54999L6.43 12.24C6.50187 12.3204 6.58964 12.385 6.68775 12.4297Z"
  });
  svg.appendChild(g2).append(path, path2);
  const speakerDefs = createElementNS("defs");
  const speakerClipPathDef = setAttributesNS(createElementNS("clipPath"), {
    id: "clip0_57_156"
  });
  const speakerRect = setAttributesNS(createElementNS("rect"), {
    width: `${WIDTH}`,
    height: `${WIDTH}`,
    fill: "white",
    transform: "translate(0 0.5)"
  });
  speakerClipPathDef.appendChild(speakerRect);
  speakerDefs.appendChild(speakerClipPathDef);
  svg.appendChild(speakerDefs).appendChild(speakerClipPathDef).appendChild(speakerRect);
  return svg;
}
function Dialog({ open, onFormSubmitted, ...props }) {
  const options = props.options;
  const successIconHtml = q(() => ({ __html: SuccessIcon().outerHTML }), []);
  const [timeoutId, setTimeoutId] = p(null);
  const handleOnSuccessClick = x(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    onFormSubmitted();
  }, [timeoutId]);
  const onSubmitSuccess = x(
    (data, eventId) => {
      props.onSubmitSuccess(data, eventId);
      setTimeoutId(
        setTimeout(() => {
          onFormSubmitted();
          setTimeoutId(null);
        }, SUCCESS_MESSAGE_TIMEOUT)
      );
    },
    [onFormSubmitted]
  );
  return /* @__PURE__ */ y$1(g$1, null, timeoutId ? /* @__PURE__ */ y$1("div", { class: "success__position", onClick: handleOnSuccessClick }, /* @__PURE__ */ y$1("div", { class: "success__content" }, options.successMessageText, /* @__PURE__ */ y$1("span", { class: "success__icon", dangerouslySetInnerHTML: successIconHtml }))) : /* @__PURE__ */ y$1("dialog", { class: "dialog", onClick: options.onFormClose, open }, /* @__PURE__ */ y$1("div", { class: "dialog__position" }, /* @__PURE__ */ y$1(
    "div",
    {
      class: "dialog__content",
      onClick: (e2) => {
        e2.stopPropagation();
      }
    },
    /* @__PURE__ */ y$1(DialogHeader, { options }),
    /* @__PURE__ */ y$1(Form, { ...props, onSubmitSuccess })
  ))));
}
const DIALOG = `
.dialog {
  position: fixed;
  z-index: var(--z-index);
  margin: 0;
  inset: 0;

  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  height: 100vh;
  width: 100vw;

  color: var(--dialog-color, var(--foreground));
  fill: var(--dialog-color, var(--foreground));
  line-height: 1.75em;

  background-color: rgba(0, 0, 0, 0.05);
  border: none;
  inset: 0;
  opacity: 1;
  transition: opacity 0.2s ease-in-out;
}

.dialog__position {
  position: fixed;
  z-index: var(--z-index);
  inset: var(--dialog-inset);
  padding: var(--page-margin);
  display: flex;
  max-height: calc(100vh - (2 * var(--page-margin)));
}
@media (max-width: 600px) {
  .dialog__position {
    inset: var(--page-margin);
    padding: 0;
  }
}

.dialog__position:has(.editor) {
  inset: var(--page-margin);
  padding: 0;
}

.dialog:not([open]) {
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
}
.dialog:not([open]) .dialog__content {
  transform: translate(0, -16px) scale(0.98);
}

.dialog__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: var(--dialog-padding, 24px);
  max-width: 100%;
  width: 100%;
  max-height: 100%;
  overflow: auto;

  background: var(--dialog-background, var(--background));
  border-radius: var(--dialog-border-radius, 20px);
  border: var(--dialog-border, var(--border));
  box-shadow: var(--dialog-box-shadow, var(--box-shadow));
  transform: translate(0, 0) scale(1);
  transition: transform 0.2s ease-in-out;
}

`;
const DIALOG_HEADER = `
.dialog__header {
  display: flex;
  gap: 4px;
  justify-content: space-between;
  font-weight: var(--dialog-header-weight, 600);
  margin: 0;
}
.dialog__title {
  align-self: center;
  width: var(--form-width, 272px);
}

@media (max-width: 600px) {
  .dialog__title {
    width: auto;
  }
}

.dialog__position:has(.editor) .dialog__title {
  width: auto;
}


.brand-link {
  display: inline-flex;
}
.brand-link:focus-visible {
  outline: var(--outline);
}
`;
const FORM = `
.form {
  display: flex;
  overflow: auto;
  flex-direction: row;
  gap: 16px;
  flex: 1 0;
}

.form fieldset {
  border: none;
  margin: 0;
  padding: 0;
}

.form__right {
  flex: 0 0 auto;
  display: flex;
  overflow: auto;
  flex-direction: column;
  justify-content: space-between;
  gap: 20px;
  width: var(--form-width, 100%);
}

.dialog__position:has(.editor) .form__right {
  width: var(--form-width, 272px);
}

.form__top {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form__error-container {
  color: var(--error-color);
  fill: var(--error-color);
}

.form__label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0px;
}

.form__label__text {
  display: flex;
  gap: 4px;
  align-items: center;
}

.form__label__text--required {
  font-size: 0.85em;
}

.form__input {
  font-family: inherit;
  line-height: inherit;
  background: transparent;
  box-sizing: border-box;
  border: var(--input-border, var(--border));
  border-radius: var(--input-border-radius, 6px);
  color: var(--input-color, inherit);
  fill: var(--input-color, inherit);
  font-size: var(--input-font-size, inherit);
  font-weight: var(--input-font-weight, 500);
  padding: 6px 12px;
}

.form__input::placeholder {
  opacity: 0.65;
  color: var(--input-placeholder-color, inherit);
  filter: var(--interactive-filter);
}

.form__input:focus-visible {
  outline: var(--input-focus-outline, var(--outline));
}

.form__input--textarea {
  font-family: inherit;
  resize: vertical;
}

.error {
  color: var(--error-color);
  fill: var(--error-color);
}
`;
const BUTTON = `
.btn-group {
  display: grid;
  gap: 8px;
}

.btn {
  line-height: inherit;
  border: var(--button-border, var(--border));
  border-radius: var(--button-border-radius, 6px);
  cursor: pointer;
  font-family: inherit;
  font-size: var(--button-font-size, inherit);
  font-weight: var(--button-font-weight, 600);
  padding: var(--button-padding, 6px 16px);
}
.btn[disabled] {
  opacity: 0.6;
  pointer-events: none;
}

.btn--primary {
  color: var(--button-primary-color, var(--accent-foreground));
  fill: var(--button-primary-color, var(--accent-foreground));
  background: var(--button-primary-background, var(--accent-background));
  border: var(--button-primary-border, var(--border));
  border-radius: var(--button-primary-border-radius, 6px);
  font-weight: var(--button-primary-font-weight, 500);
}
.btn--primary:hover {
  color: var(--button-primary-hover-color, var(--accent-foreground));
  fill: var(--button-primary-hover-color, var(--accent-foreground));
  background: var(--button-primary-hover-background, var(--accent-background));
  filter: var(--interactive-filter);
}
.btn--primary:focus-visible {
  background: var(--button-primary-hover-background, var(--accent-background));
  filter: var(--interactive-filter);
  outline: var(--button-primary-focus-outline, var(--outline));
}

.btn--default {
  color: var(--button-color, var(--foreground));
  fill: var(--button-color, var(--foreground));
  background: var(--button-background, var(--background));
  border: var(--button-border, var(--border));
  border-radius: var(--button-border-radius, 6px);
  font-weight: var(--button-font-weight, 500);
}
.btn--default:hover {
  color: var(--button-color, var(--foreground));
  fill: var(--button-color, var(--foreground));
  background: var(--button-hover-background, var(--background));
  filter: var(--interactive-filter);
}
.btn--default:focus-visible {
  background: var(--button-hover-background, var(--background));
  filter: var(--interactive-filter);
  outline: var(--button-focus-outline, var(--outline));
}
`;
const SUCCESS = `
.success__position {
  position: fixed;
  inset: var(--dialog-inset);
  padding: var(--page-margin);
  z-index: var(--z-index);
}
.success__content {
  background: var(--success-background, var(--background));
  border: var(--success-border, var(--border));
  border-radius: var(--success-border-radius, 1.7em/50%);
  box-shadow: var(--success-box-shadow, var(--box-shadow));
  font-weight: var(--success-font-weight, 600);
  color: var(--success-color);
  fill: var(--success-color);
  padding: 12px 24px;
  line-height: 1.75em;

  display: grid;
  align-items: center;
  grid-auto-flow: column;
  gap: 6px;
  cursor: default;
}

.success__icon {
  display: flex;
}
`;
function createDialogStyles(styleNonce) {
  const style = DOCUMENT.createElement("style");
  style.textContent = `
:host {
  --dialog-inset: var(--inset);
}

${DIALOG}
${DIALOG_HEADER}
${FORM}
${BUTTON}
${SUCCESS}
`;
  if (styleNonce) {
    style.setAttribute("nonce", styleNonce);
  }
  return style;
}
function getUser() {
  const currentUser = getCurrentScope().getUser();
  const isolationUser = getIsolationScope().getUser();
  const globalUser = getGlobalScope().getUser();
  if (currentUser && Object.keys(currentUser).length) {
    return currentUser;
  }
  if (isolationUser && Object.keys(isolationUser).length) {
    return isolationUser;
  }
  return globalUser;
}
const feedbackModalIntegration = (() => {
  return {
    name: "FeedbackModal",
    setupOnce() {
    },
    createDialog: ({ options, screenshotIntegration, sendFeedback: sendFeedback2, shadow }) => {
      const shadowRoot = shadow;
      const userKey = options.useSentryUser;
      const user = getUser();
      const el = DOCUMENT.createElement("div");
      const style = createDialogStyles(options.styleNonce);
      let originalOverflow = "";
      const dialog = {
        get el() {
          return el;
        },
        appendToDom() {
          if (!shadowRoot.contains(style) && !shadowRoot.contains(el)) {
            shadowRoot.appendChild(style);
            shadowRoot.appendChild(el);
          }
        },
        removeFromDom() {
          el.remove();
          style.remove();
          DOCUMENT.body.style.overflow = originalOverflow;
        },
        open() {
          renderContent(true);
          options.onFormOpen?.();
          getClient()?.emit("openFeedbackWidget");
          originalOverflow = DOCUMENT.body.style.overflow;
          DOCUMENT.body.style.overflow = "hidden";
        },
        close() {
          renderContent(false);
          DOCUMENT.body.style.overflow = originalOverflow;
        }
      };
      const screenshotInput = screenshotIntegration?.createInput({ h: y$1, hooks, dialog, options });
      const renderContent = (open) => {
        B$1(
          /* @__PURE__ */ y$1(
            Dialog,
            {
              options,
              screenshotInput,
              showName: options.showName || options.isNameRequired,
              showEmail: options.showEmail || options.isEmailRequired,
              defaultName: String(userKey && user?.[userKey.name] || ""),
              defaultEmail: String(userKey && user?.[userKey.email] || ""),
              onFormClose: () => {
                renderContent(false);
                options.onFormClose?.();
              },
              onSubmit: sendFeedback2,
              onSubmitSuccess: (data, eventId) => {
                renderContent(false);
                options.onSubmitSuccess?.(data, eventId);
              },
              onSubmitError: (error2) => {
                options.onSubmitError?.(error2);
              },
              onFormSubmitted: () => {
                options.onFormSubmitted?.();
              },
              open
            }
          ),
          el
        );
      };
      return dialog;
    }
  };
});
function IconCloseFactory({
  h: h2
  // eslint-disable-line @typescript-eslint/no-unused-vars
}) {
  return function IconClose() {
    return /* @__PURE__ */ h2("svg", { "data-test-id": "icon-close", viewBox: "0 0 16 16", fill: "#2B2233", height: "25px", width: "25px" }, /* @__PURE__ */ h2("circle", { r: "7", cx: "8", cy: "8", fill: "white" }), /* @__PURE__ */ h2(
      "path",
      {
        strokeWidth: "1.5",
        d: "M8,16a8,8,0,1,1,8-8A8,8,0,0,1,8,16ZM8,1.53A6.47,6.47,0,1,0,14.47,8,6.47,6.47,0,0,0,8,1.53Z"
      }
    ), /* @__PURE__ */ h2(
      "path",
      {
        strokeWidth: "1.5",
        d: "M5.34,11.41a.71.71,0,0,1-.53-.22.74.74,0,0,1,0-1.06l5.32-5.32a.75.75,0,0,1,1.06,1.06L5.87,11.19A.74.74,0,0,1,5.34,11.41Z"
      }
    ), /* @__PURE__ */ h2(
      "path",
      {
        strokeWidth: "1.5",
        d: "M10.66,11.41a.74.74,0,0,1-.53-.22L4.81,5.87A.75.75,0,0,1,5.87,4.81l5.32,5.32a.74.74,0,0,1,0,1.06A.71.71,0,0,1,10.66,11.41Z"
      }
    ));
  };
}
function createScreenshotInputStyles(styleNonce) {
  const style = DOCUMENT.createElement("style");
  const surface200 = "#1A141F";
  const gray100 = "#302735";
  style.textContent = `
.editor {
  display: flex;
  flex-grow: 1;
  flex-direction: column;
}

.editor__image-container {
  justify-items: center;
  padding: 15px;
  position: relative;
  height: 100%;
  border-radius: var(--menu-border-radius, 6px);

  background-color: ${surface200};
  background-image: repeating-linear-gradient(
      -145deg,
      transparent,
      transparent 8px,
      ${surface200} 8px,
      ${surface200} 11px
    ),
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 15px,
      ${gray100} 15px,
      ${gray100} 16px
    );
}

.editor__canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.editor__canvas-container > * {
  object-fit: contain;
  position: absolute;
}

.editor__tool-container {
  padding-top: 8px;
  display: flex;
  justify-content: center;
}

.editor__tool-bar {
  display: flex;
  gap: 8px;
}

.editor__tool {
  display: flex;
  padding: 8px 12px;
  justify-content: center;
  align-items: center;
  border: var(--button-border, var(--border));
  border-radius: var(--button-border-radius, 6px);
  background: var(--button-background, var(--background));
  color: var(--button-color, var(--foreground));
}

.editor__tool--active {
  background: var(--button-primary-background, var(--accent-background));
  color: var(--button-primary-color, var(--accent-foreground));
}

.editor__rect {
  position: absolute;
  z-index: 2;
}

.editor__rect button {
  opacity: 0;
  position: absolute;
  top: -12px;
  right: -12px;
  cursor: pointer;
  padding: 0;
  z-index: 3;
  border: none;
  background: none;
}

.editor__rect:hover button {
  opacity: 1;
}
`;
  if (styleNonce) {
    style.setAttribute("nonce", styleNonce);
  }
  return style;
}
function ToolbarFactory({
  h: h2
  // eslint-disable-line @typescript-eslint/no-unused-vars
}) {
  return function Toolbar({
    action,
    setAction,
    options
  }) {
    return /* @__PURE__ */ h2("div", { class: "editor__tool-container" }, /* @__PURE__ */ h2("div", { class: "editor__tool-bar" }, /* @__PURE__ */ h2(
      "button",
      {
        type: "button",
        class: `editor__tool ${action === "highlight" ? "editor__tool--active" : ""}`,
        onClick: () => {
          setAction(action === "highlight" ? "" : "highlight");
        }
      },
      options.highlightToolText
    ), /* @__PURE__ */ h2(
      "button",
      {
        type: "button",
        class: `editor__tool ${action === "hide" ? "editor__tool--active" : ""}`,
        onClick: () => {
          setAction(action === "hide" ? "" : "hide");
        }
      },
      options.hideToolText
    )));
  };
}
function useTakeScreenshotFactory({ hooks: hooks2 }) {
  function useDpi() {
    const [dpi, setDpi] = hooks2.useState(WINDOW$5.devicePixelRatio ?? 1);
    hooks2.useEffect(() => {
      const onChange = () => {
        setDpi(WINDOW$5.devicePixelRatio);
      };
      const media = matchMedia(`(resolution: ${WINDOW$5.devicePixelRatio}dppx)`);
      media.addEventListener("change", onChange);
      return () => {
        media.removeEventListener("change", onChange);
      };
    }, []);
    return dpi;
  }
  return function useTakeScreenshot({ onBeforeScreenshot, onScreenshot, onAfterScreenshot, onError }) {
    const dpi = useDpi();
    hooks2.useEffect(() => {
      const takeScreenshot = async () => {
        onBeforeScreenshot();
        const stream = await NAVIGATOR$1.mediaDevices.getDisplayMedia({
          video: {
            width: WINDOW$5.innerWidth * dpi,
            height: WINDOW$5.innerHeight * dpi
          },
          audio: false,
          // @ts-expect-error experimental flags: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia#prefercurrenttab
          monitorTypeSurfaces: "exclude",
          preferCurrentTab: true,
          selfBrowserSurface: "include",
          surfaceSwitching: "exclude"
        });
        const video = DOCUMENT.createElement("video");
        await new Promise((resolve, reject) => {
          video.srcObject = stream;
          video.onloadedmetadata = () => {
            onScreenshot(video, dpi);
            stream.getTracks().forEach((track) => track.stop());
            resolve();
          };
          video.play().catch(reject);
        });
        onAfterScreenshot();
      };
      takeScreenshot().catch(onError);
    }, []);
  };
}
function drawRect(command, ctx, color) {
  switch (command.type) {
    case "highlight": {
      ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
      ctx.shadowBlur = 50;
      ctx.fillStyle = color;
      ctx.fillRect(command.x - 1, command.y - 1, command.w + 2, command.h + 2);
      ctx.clearRect(command.x, command.y, command.w, command.h);
      break;
    }
    case "hide":
      ctx.fillStyle = "rgb(0, 0, 0)";
      ctx.fillRect(command.x, command.y, command.w, command.h);
      break;
  }
}
function with2dContext(canvas, options, callback) {
  if (!canvas) {
    return;
  }
  const ctx = canvas.getContext("2d", options);
  if (!ctx) {
    return;
  }
  callback(canvas, ctx);
}
function paintImage(maybeDest, source) {
  with2dContext(maybeDest, { alpha: true }, (destCanvas, destCtx) => {
    destCtx.drawImage(source, 0, 0, source.width, source.height, 0, 0, destCanvas.width, destCanvas.height);
  });
}
function paintForeground(maybeCanvas, strokeColor, drawCommands) {
  with2dContext(maybeCanvas, { alpha: true }, (canvas, ctx) => {
    if (drawCommands.length) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    drawCommands.forEach((command) => {
      drawRect(command, ctx, strokeColor);
    });
  });
}
function ScreenshotEditorFactory({
  h: h2,
  hooks: hooks2,
  outputBuffer,
  dialog,
  options
}) {
  const useTakeScreenshot = useTakeScreenshotFactory({ hooks: hooks2 });
  const Toolbar = ToolbarFactory({ h: h2 });
  const IconClose = IconCloseFactory({ h: h2 });
  const editorStyleInnerText = { __html: createScreenshotInputStyles(options.styleNonce).innerText };
  const dialogStyle = dialog.el.style;
  const ScreenshotEditor = ({ screenshot }) => {
    const [action, setAction] = hooks2.useState("highlight");
    const [drawCommands, setDrawCommands] = hooks2.useState([]);
    const measurementRef = hooks2.useRef(null);
    const backgroundRef = hooks2.useRef(null);
    const foregroundRef = hooks2.useRef(null);
    const mouseRef = hooks2.useRef(null);
    const [scaleFactor, setScaleFactor] = hooks2.useState(1);
    const strokeColor = hooks2.useMemo(() => {
      const sentryFeedback = DOCUMENT.getElementById(options.id);
      if (!sentryFeedback) {
        return "white";
      }
      const computedStyle = getComputedStyle(sentryFeedback);
      return computedStyle.getPropertyValue("--button-primary-background") || computedStyle.getPropertyValue("--accent-background");
    }, [options.id]);
    hooks2.useLayoutEffect(() => {
      const handleResize = () => {
        const measurementDiv = measurementRef.current;
        if (!measurementDiv) {
          return;
        }
        with2dContext(screenshot.canvas, { alpha: false }, (canvas) => {
          const scale = Math.min(
            measurementDiv.clientWidth / canvas.width,
            measurementDiv.clientHeight / canvas.height
          );
          setScaleFactor(scale);
        });
        if (measurementDiv.clientHeight === 0 || measurementDiv.clientWidth === 0) {
          setTimeout(handleResize, 0);
        }
      };
      handleResize();
      WINDOW$5.addEventListener("resize", handleResize);
      return () => {
        WINDOW$5.removeEventListener("resize", handleResize);
      };
    }, [screenshot]);
    const setCanvasSize = hooks2.useCallback(
      (maybeCanvas, scale) => {
        with2dContext(maybeCanvas, { alpha: true }, (canvas, ctx) => {
          ctx.scale(scale, scale);
          canvas.width = screenshot.canvas.width;
          canvas.height = screenshot.canvas.height;
        });
      },
      [screenshot]
    );
    hooks2.useEffect(() => {
      setCanvasSize(backgroundRef.current, screenshot.dpi);
      paintImage(backgroundRef.current, screenshot.canvas);
    }, [screenshot]);
    hooks2.useEffect(() => {
      setCanvasSize(foregroundRef.current, screenshot.dpi);
      with2dContext(foregroundRef.current, { alpha: true }, (canvas, ctx) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      });
      paintForeground(foregroundRef.current, strokeColor, drawCommands);
    }, [drawCommands, strokeColor]);
    hooks2.useEffect(() => {
      setCanvasSize(outputBuffer, screenshot.dpi);
      paintImage(outputBuffer, screenshot.canvas);
      with2dContext(DOCUMENT.createElement("canvas"), { alpha: true }, (foreground, ctx) => {
        ctx.scale(screenshot.dpi, screenshot.dpi);
        foreground.width = screenshot.canvas.width;
        foreground.height = screenshot.canvas.height;
        paintForeground(foreground, strokeColor, drawCommands);
        paintImage(outputBuffer, foreground);
      });
    }, [drawCommands, screenshot, strokeColor]);
    const handleMouseDown = (e2) => {
      if (!action || !mouseRef.current) {
        return;
      }
      const boundingRect = mouseRef.current.getBoundingClientRect();
      const startingPoint = {
        type: action,
        x: e2.offsetX / scaleFactor,
        y: e2.offsetY / scaleFactor
      };
      const getDrawCommand = (startingPoint2, e22) => {
        const x2 = (e22.clientX - boundingRect.x) / scaleFactor;
        const y2 = (e22.clientY - boundingRect.y) / scaleFactor;
        return {
          type: startingPoint2.type,
          x: Math.min(startingPoint2.x, x2),
          y: Math.min(startingPoint2.y, y2),
          w: Math.abs(x2 - startingPoint2.x),
          h: Math.abs(y2 - startingPoint2.y)
        };
      };
      const handleMouseMove = (e22) => {
        with2dContext(foregroundRef.current, { alpha: true }, (canvas, ctx) => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
        paintForeground(foregroundRef.current, strokeColor, [...drawCommands, getDrawCommand(startingPoint, e22)]);
      };
      const handleMouseUp = (e22) => {
        const drawCommand = getDrawCommand(startingPoint, e22);
        if (drawCommand.w * scaleFactor >= 1 && drawCommand.h * scaleFactor >= 1) {
          setDrawCommands((prev) => [...prev, drawCommand]);
        }
        DOCUMENT.removeEventListener("mousemove", handleMouseMove);
        DOCUMENT.removeEventListener("mouseup", handleMouseUp);
      };
      DOCUMENT.addEventListener("mousemove", handleMouseMove);
      DOCUMENT.addEventListener("mouseup", handleMouseUp);
    };
    const deleteRect = hooks2.useCallback((index) => {
      return (e2) => {
        e2.preventDefault();
        e2.stopPropagation();
        setDrawCommands((prev) => {
          const updatedRects = [...prev];
          updatedRects.splice(index, 1);
          return updatedRects;
        });
      };
    }, []);
    const dimensions = {
      width: `${screenshot.canvas.width * scaleFactor}px`,
      height: `${screenshot.canvas.height * scaleFactor}px`
    };
    const handleStopPropagation = (e2) => {
      e2.stopPropagation();
    };
    return /* @__PURE__ */ h2("div", { class: "editor" }, /* @__PURE__ */ h2("style", { nonce: options.styleNonce, dangerouslySetInnerHTML: editorStyleInnerText }), /* @__PURE__ */ h2("div", { class: "editor__image-container" }, /* @__PURE__ */ h2("div", { class: "editor__canvas-container", ref: measurementRef }, /* @__PURE__ */ h2("canvas", { ref: backgroundRef, id: "background", style: dimensions }), /* @__PURE__ */ h2("canvas", { ref: foregroundRef, id: "foreground", style: dimensions }), /* @__PURE__ */ h2("div", { ref: mouseRef, onMouseDown: handleMouseDown, style: dimensions }, drawCommands.map((rect, index) => /* @__PURE__ */ h2(
      "div",
      {
        key: index,
        class: "editor__rect",
        style: {
          top: `${rect.y * scaleFactor}px`,
          left: `${rect.x * scaleFactor}px`,
          width: `${rect.w * scaleFactor}px`,
          height: `${rect.h * scaleFactor}px`
        }
      },
      /* @__PURE__ */ h2(
        "button",
        {
          "aria-label": options.removeHighlightText,
          onClick: deleteRect(index),
          onMouseDown: handleStopPropagation,
          onMouseUp: handleStopPropagation,
          type: "button"
        },
        /* @__PURE__ */ h2(IconClose, null)
      )
    ))))), /* @__PURE__ */ h2(Toolbar, { options, action, setAction }));
  };
  return function Wrapper({ onError }) {
    const [screenshot, setScreenshot] = hooks2.useState();
    useTakeScreenshot({
      onBeforeScreenshot: hooks2.useCallback(() => {
        dialogStyle.display = "none";
      }, []),
      onScreenshot: hooks2.useCallback((screenshotVideo, dpi) => {
        with2dContext(DOCUMENT.createElement("canvas"), { alpha: false }, (canvas, ctx) => {
          ctx.scale(dpi, dpi);
          canvas.width = screenshotVideo.videoWidth;
          canvas.height = screenshotVideo.videoHeight;
          ctx.drawImage(screenshotVideo, 0, 0, canvas.width, canvas.height);
          setScreenshot({ canvas, dpi });
        });
        outputBuffer.width = screenshotVideo.videoWidth;
        outputBuffer.height = screenshotVideo.videoHeight;
      }, []),
      onAfterScreenshot: hooks2.useCallback(() => {
        dialogStyle.display = "block";
      }, []),
      onError: hooks2.useCallback((error2) => {
        dialogStyle.display = "block";
        onError(error2);
      }, [])
    });
    if (screenshot) {
      return /* @__PURE__ */ h2(ScreenshotEditor, { screenshot });
    }
    return /* @__PURE__ */ h2("div", null);
  };
}
const feedbackScreenshotIntegration = (() => {
  return {
    name: "FeedbackScreenshot",
    setupOnce() {
    },
    createInput: ({ h: h2, hooks: hooks2, dialog, options }) => {
      const outputBuffer = DOCUMENT.createElement("canvas");
      return {
        input: ScreenshotEditorFactory({
          h: h2,
          hooks: hooks2,
          outputBuffer,
          dialog,
          options
        }),
        // eslint-disable-line @typescript-eslint/no-explicit-any
        value: async () => {
          const blob = await new Promise((resolve) => {
            outputBuffer.toBlob(resolve, "image/png");
          });
          if (blob) {
            const data = new Uint8Array(await blob.arrayBuffer());
            const attachment = {
              data,
              filename: "screenshot.png",
              contentType: "application/png"
              // attachmentType?: string;
            };
            return attachment;
          }
          return void 0;
        }
      };
    }
  };
});
const WINDOW$4 = GLOBAL_OBJ;
let ignoreOnError = 0;
function shouldIgnoreOnError() {
  return ignoreOnError > 0;
}
function ignoreNextOnError() {
  ignoreOnError++;
  setTimeout(() => {
    ignoreOnError--;
  });
}
function wrap(fn, options = {}) {
  function isFunction(fn2) {
    return typeof fn2 === "function";
  }
  if (!isFunction(fn)) {
    return fn;
  }
  try {
    const wrapper = fn.__sentry_wrapped__;
    if (wrapper) {
      if (typeof wrapper === "function") {
        return wrapper;
      } else {
        return fn;
      }
    }
    if (getOriginalFunction(fn)) {
      return fn;
    }
  } catch {
    return fn;
  }
  const sentryWrapped = function(...args) {
    GLOBAL_OBJ._sentryWrappedDepth = (GLOBAL_OBJ._sentryWrappedDepth || 0) + 1;
    try {
      const wrappedArguments = args.map((arg) => wrap(arg, options));
      return fn.apply(this, wrappedArguments);
    } catch (ex) {
      ignoreNextOnError();
      withScope((scope) => {
        scope.addEventProcessor((event) => {
          if (options.mechanism) {
            addExceptionTypeValue(event, void 0);
            addExceptionMechanism(event, options.mechanism);
          }
          event.extra = {
            ...event.extra,
            arguments: args
          };
          return event;
        });
        captureException(ex);
      });
      throw ex;
    } finally {
      GLOBAL_OBJ._sentryWrappedDepth = (GLOBAL_OBJ._sentryWrappedDepth || 0) - 1;
    }
  };
  try {
    for (const property in fn) {
      if (Object.prototype.hasOwnProperty.call(fn, property)) {
        sentryWrapped[property] = fn[property];
      }
    }
  } catch {
  }
  markFunctionWrapped(sentryWrapped, fn);
  addNonEnumerableProperty(fn, "__sentry_wrapped__", sentryWrapped);
  try {
    const descriptor = Object.getOwnPropertyDescriptor(sentryWrapped, "name");
    if (descriptor.configurable) {
      Object.defineProperty(sentryWrapped, "name", {
        get() {
          return fn.name;
        }
      });
    }
  } catch {
  }
  return sentryWrapped;
}
function getHttpRequestData() {
  const url = getLocationHref();
  const { referrer } = WINDOW$4.document || {};
  const { userAgent } = WINDOW$4.navigator || {};
  const headers = {
    ...referrer && { Referer: referrer },
    ...userAgent && { "User-Agent": userAgent }
  };
  const request = {
    url,
    headers
  };
  return request;
}
const LAZY_LOADABLE_NAMES = [
  "replayIntegration",
  "replayCanvasIntegration",
  "feedbackIntegration",
  "feedbackModalIntegration",
  "feedbackScreenshotIntegration",
  "captureConsoleIntegration",
  "contextLinesIntegration",
  "linkedErrorsIntegration",
  "dedupeIntegration",
  "extraErrorDataIntegration",
  "graphqlClientIntegration",
  "httpClientIntegration",
  "reportingObserverIntegration",
  "rewriteFramesIntegration",
  "browserProfilingIntegration",
  "moduleMetadataIntegration",
  "instrumentAnthropicAiClient",
  "instrumentOpenAiClient",
  "instrumentGoogleGenAIClient",
  "instrumentLangGraph",
  "createLangChainCallbackHandler",
  "instrumentLangChainEmbeddings"
];
const HYPHENATED_BUNDLES = {
  replayCanvasIntegration: "replay-canvas",
  feedbackModalIntegration: "feedback-modal",
  feedbackScreenshotIntegration: "feedback-screenshot"
};
function getBundleName(name) {
  return HYPHENATED_BUNDLES[name] || name.replace("Integration", "").toLowerCase();
}
const WindowWithMaybeIntegration = WINDOW$4;
async function lazyLoadIntegration(name, scriptNonce) {
  const bundle = LAZY_LOADABLE_NAMES.includes(name) ? getBundleName(name) : void 0;
  const sentryOnWindow = WindowWithMaybeIntegration.Sentry = WindowWithMaybeIntegration.Sentry || {};
  if (!bundle) {
    throw new Error(`Cannot lazy load integration: ${name}`);
  }
  const existing = sentryOnWindow[name];
  if (typeof existing === "function" && !("_isShim" in existing)) {
    return existing;
  }
  const url = getScriptURL(bundle);
  const script = WINDOW$4.document.createElement("script");
  script.src = url;
  script.crossOrigin = "anonymous";
  script.referrerPolicy = "strict-origin";
  if (scriptNonce) {
    script.setAttribute("nonce", scriptNonce);
  }
  const waitForLoad = new Promise((resolve, reject) => {
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", reject);
  });
  const currentScript = WINDOW$4.document.currentScript;
  const parent = WINDOW$4.document.body || WINDOW$4.document.head || currentScript?.parentElement;
  if (parent) {
    parent.appendChild(script);
  } else {
    throw new Error(`Could not find parent element to insert lazy-loaded ${name} script`);
  }
  try {
    await waitForLoad;
  } catch {
    throw new Error(`Error when loading integration: ${name}`);
  }
  const integrationFn = sentryOnWindow[name];
  if (typeof integrationFn !== "function") {
    throw new Error(`Could not load integration: ${name}`);
  }
  return integrationFn;
}
function getScriptURL(bundle) {
  const client = getClient();
  const baseURL = client?.getOptions()?.cdnBaseUrl || "https://browser.sentry-cdn.com";
  return new URL(`/${SDK_VERSION}/${bundle}.min.js`, baseURL).toString();
}
const feedbackAsyncIntegration = buildFeedbackIntegration({
  lazyLoadIntegration
});
const feedbackSyncIntegration = buildFeedbackIntegration({
  getModalIntegration: () => feedbackModalIntegration,
  getScreenshotIntegration: () => feedbackScreenshotIntegration
});
function exceptionFromError(stackParser, ex) {
  const frames = parseStackFrames(stackParser, ex);
  const exception = {
    type: extractType(ex),
    value: extractMessage(ex)
  };
  if (frames.length) {
    exception.stacktrace = { frames };
  }
  if (exception.type === void 0 && exception.value === "") {
    exception.value = "Unrecoverable error caught";
  }
  return exception;
}
function eventFromPlainObject(stackParser, exception, syntheticException, isUnhandledRejection) {
  const client = getClient();
  const normalizeDepth = client?.getOptions().normalizeDepth;
  const errorFromProp = getErrorPropertyFromObject(exception);
  const extra = {
    __serialized__: normalizeToSize(exception, normalizeDepth)
  };
  if (errorFromProp) {
    return {
      exception: {
        values: [exceptionFromError(stackParser, errorFromProp)]
      },
      extra
    };
  }
  const event = {
    exception: {
      values: [
        {
          type: isEvent(exception) ? exception.constructor.name : isUnhandledRejection ? "UnhandledRejection" : "Error",
          value: getNonErrorObjectExceptionValue(exception, { isUnhandledRejection })
        }
      ]
    },
    extra
  };
  if (syntheticException) {
    const frames = parseStackFrames(stackParser, syntheticException);
    if (frames.length) {
      event.exception.values[0].stacktrace = { frames };
    }
  }
  return event;
}
function eventFromError(stackParser, ex) {
  return {
    exception: {
      values: [exceptionFromError(stackParser, ex)]
    }
  };
}
function parseStackFrames(stackParser, ex) {
  const stacktrace = ex.stacktrace || ex.stack || "";
  const skipLines = getSkipFirstStackStringLines(ex);
  const framesToPop = getPopFirstTopFrames(ex);
  try {
    return stackParser(stacktrace, skipLines, framesToPop);
  } catch {
  }
  return [];
}
const reactMinifiedRegexp = /Minified React error #\d+;/i;
function getSkipFirstStackStringLines(ex) {
  if (ex && reactMinifiedRegexp.test(ex.message)) {
    return 1;
  }
  return 0;
}
function getPopFirstTopFrames(ex) {
  if (typeof ex.framesToPop === "number") {
    return ex.framesToPop;
  }
  return 0;
}
function isWebAssemblyException(exception) {
  if (typeof WebAssembly !== "undefined" && typeof WebAssembly.Exception !== "undefined") {
    return exception instanceof WebAssembly.Exception;
  } else {
    return false;
  }
}
function extractType(ex) {
  const name = ex?.name;
  if (!name && isWebAssemblyException(ex)) {
    const hasTypeInMessage = ex.message && Array.isArray(ex.message) && ex.message.length == 2;
    return hasTypeInMessage ? ex.message[0] : "WebAssembly.Exception";
  }
  return name;
}
function extractMessage(ex) {
  const message = ex?.message;
  if (isWebAssemblyException(ex)) {
    if (Array.isArray(ex.message) && ex.message.length == 2) {
      return ex.message[1];
    }
    return "wasm exception";
  }
  if (!message) {
    return "No error message";
  }
  if (message.error && typeof message.error.message === "string") {
    return _enhanceErrorWithSentryInfo(message.error);
  }
  return _enhanceErrorWithSentryInfo(ex);
}
function eventFromException(stackParser, exception, hint, attachStacktrace) {
  const syntheticException = hint?.syntheticException || void 0;
  const event = eventFromUnknownInput(stackParser, exception, syntheticException, attachStacktrace);
  addExceptionMechanism(event);
  event.level = "error";
  if (hint?.event_id) {
    event.event_id = hint.event_id;
  }
  return resolvedSyncPromise(event);
}
function eventFromMessage(stackParser, message, level = "info", hint, attachStacktrace) {
  const syntheticException = hint?.syntheticException || void 0;
  const event = eventFromString(stackParser, message, syntheticException, attachStacktrace);
  event.level = level;
  if (hint?.event_id) {
    event.event_id = hint.event_id;
  }
  return resolvedSyncPromise(event);
}
function eventFromUnknownInput(stackParser, exception, syntheticException, attachStacktrace, isUnhandledRejection) {
  let event;
  if (isErrorEvent$2(exception) && exception.error) {
    const errorEvent = exception;
    return eventFromError(stackParser, errorEvent.error);
  }
  if (isDOMError(exception) || isDOMException(exception)) {
    const domException = exception;
    if ("stack" in exception) {
      event = eventFromError(stackParser, exception);
      const firstException = event.exception?.values?.[0];
      if (attachStacktrace && syntheticException && firstException && !firstException.stacktrace) {
        const frames = parseStackFrames(stackParser, syntheticException);
        if (frames.length) {
          firstException.stacktrace = { frames };
          addExceptionMechanism(event, { synthetic: true });
        }
      }
    } else {
      const name = domException.name || (isDOMError(domException) ? "DOMError" : "DOMException");
      const message = domException.message ? `${name}: ${domException.message}` : name;
      event = eventFromString(stackParser, message, syntheticException, attachStacktrace);
      addExceptionTypeValue(event, message);
    }
    if ("code" in domException) {
      event.tags = { ...event.tags, "DOMException.code": `${domException.code}` };
    }
    return event;
  }
  if (isError(exception)) {
    return eventFromError(stackParser, exception);
  }
  if (isPlainObject(exception) || isEvent(exception)) {
    const objectException = exception;
    event = eventFromPlainObject(stackParser, objectException, syntheticException, isUnhandledRejection);
    addExceptionMechanism(event, {
      synthetic: true
    });
    return event;
  }
  event = eventFromString(stackParser, exception, syntheticException, attachStacktrace);
  addExceptionTypeValue(event, `${exception}`);
  addExceptionMechanism(event, {
    synthetic: true
  });
  return event;
}
function eventFromString(stackParser, message, syntheticException, attachStacktrace) {
  const event = {};
  if (attachStacktrace && syntheticException) {
    const frames = parseStackFrames(stackParser, syntheticException);
    if (frames.length) {
      event.exception = {
        values: [{ value: message, stacktrace: { frames } }]
      };
    }
    addExceptionMechanism(event, { synthetic: true });
  }
  if (isParameterizedString(message)) {
    const { __sentry_template_string__, __sentry_template_values__ } = message;
    event.logentry = {
      message: __sentry_template_string__,
      params: __sentry_template_values__
    };
    return event;
  }
  event.message = message;
  return event;
}
function getNonErrorObjectExceptionValue(exception, { isUnhandledRejection }) {
  const keys2 = extractExceptionKeysForMessage(exception);
  const captureType = isUnhandledRejection ? "promise rejection" : "exception";
  if (isErrorEvent$2(exception)) {
    return `Event \`ErrorEvent\` captured as ${captureType} with message \`${exception.message}\``;
  }
  if (isEvent(exception)) {
    const className = getObjectClassName(exception);
    return `Event \`${className}\` (type=${exception.type}) captured as ${captureType}`;
  }
  return `Object captured as ${captureType} with keys: ${keys2}`;
}
function getObjectClassName(obj) {
  try {
    const prototype = Object.getPrototypeOf(obj);
    return prototype ? prototype.constructor.name : void 0;
  } catch {
  }
}
function getErrorPropertyFromObject(obj) {
  return Object.values(obj).find((v2) => v2 instanceof Error);
}
class BrowserClient extends Client {
  /**
   * Creates a new Browser SDK instance.
   *
   * @param options Configuration options for this SDK.
   */
  constructor(options) {
    const opts = applyDefaultOptions(options);
    const sdkSource = WINDOW$4.SENTRY_SDK_SOURCE || getSDKSource();
    applySdkMetadata(opts, "browser", ["browser"], sdkSource);
    super(opts);
    const { userInfo } = this.getDataCollectionOptions();
    if (opts._metadata?.sdk) {
      opts._metadata.sdk.settings = {
        // Only allow IP inferral by Relay if the user opted in via dataCollection
        infer_ip: userInfo ? "auto" : "never",
        // purposefully allowing already passed settings to override the default
        ...opts._metadata.sdk.settings
      };
    }
    const { sendClientReports, enableLogs, _experiments, enableMetrics: enableMetricsOption } = this._options;
    const enableMetrics = enableMetricsOption ?? _experiments?.enableMetrics ?? true;
    if (WINDOW$4.document && (sendClientReports || enableLogs || enableMetrics)) {
      WINDOW$4.document.addEventListener("visibilitychange", () => {
        if (WINDOW$4.document.visibilityState === "hidden") {
          if (sendClientReports) {
            this._flushOutcomes();
          }
          if (enableLogs) {
            _INTERNAL_flushLogsBuffer(this);
          }
          if (enableMetrics) {
            _INTERNAL_flushMetricsBuffer(this);
          }
        }
      });
    }
    if (userInfo) {
      this.on("beforeSendSession", addAutoIpAddressToSession);
    }
  }
  /**
   * @inheritDoc
   */
  eventFromException(exception, hint) {
    return eventFromException(this._options.stackParser, exception, hint, this._options.attachStacktrace);
  }
  /**
   * @inheritDoc
   */
  eventFromMessage(message, level = "info", hint) {
    return eventFromMessage(this._options.stackParser, message, level, hint, this._options.attachStacktrace);
  }
  /**
   * @inheritDoc
   */
  _prepareEvent(event, hint, currentScope, isolationScope) {
    event.platform = event.platform || "javascript";
    return super._prepareEvent(event, hint, currentScope, isolationScope);
  }
}
function applyDefaultOptions(optionsArg) {
  return {
    release: typeof __SENTRY_RELEASE__ === "string" ? __SENTRY_RELEASE__ : WINDOW$4.SENTRY_RELEASE?.id,
    // This supports the variable that sentry-webpack-plugin injects
    sendClientReports: true,
    // We default this to true, as it is the safer scenario
    parentSpanIsAlwaysRootSpan: true,
    ...optionsArg
  };
}
const DEBUG_BUILD$3 = typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__;
const WINDOW$3 = GLOBAL_OBJ;
const getRating = (value, thresholds) => {
  if (value > thresholds[1]) {
    return "poor";
  }
  if (value > thresholds[0]) {
    return "needs-improvement";
  }
  return "good";
};
const bindReporter = (callback, metric, thresholds, reportAllChanges) => {
  let prevValue;
  let delta;
  return (forceReport) => {
    if (metric.value >= 0) {
      if (forceReport || reportAllChanges) {
        delta = metric.value - (prevValue ?? 0);
        if (delta || prevValue === void 0) {
          prevValue = metric.value;
          metric.delta = delta;
          metric.rating = getRating(metric.value, thresholds);
          callback(metric);
        }
      }
    }
  };
};
const getNavigationEntry = (checkResponseStart = true) => {
  const navigationEntry = WINDOW$3.performance?.getEntriesByType?.("navigation")[0];
  if (
    // sentry-specific change:
    // We don't want to check for responseStart for our own use of `getNavigationEntry`
    !checkResponseStart || navigationEntry && navigationEntry.responseStart > 0 && navigationEntry.responseStart < performance.now()
  ) {
    return navigationEntry;
  }
};
const getActivationStart = () => {
  const navEntry = getNavigationEntry();
  return navEntry?.activationStart ?? 0;
};
function addPageListener(type, listener, options) {
  if (WINDOW$3.document) {
    WINDOW$3.addEventListener(type, listener, options);
  }
}
function removePageListener(type, listener, options) {
  if (WINDOW$3.document) {
    WINDOW$3.removeEventListener(type, listener, options);
  }
}
let firstHiddenTime = -1;
const onHiddenFunctions = /* @__PURE__ */ new Set();
const initHiddenTime = () => {
  return WINDOW$3.document?.visibilityState === "hidden" && !WINDOW$3.document?.prerendering ? 0 : Infinity;
};
const onVisibilityUpdate = (event) => {
  if (isPageHidden(event) && firstHiddenTime > -1) {
    if (event.type === "visibilitychange" || event.type === "pagehide") {
      for (const onHiddenFunction of onHiddenFunctions) {
        onHiddenFunction();
      }
    }
    if (!isFinite(firstHiddenTime)) {
      firstHiddenTime = event.type === "visibilitychange" ? event.timeStamp : 0;
      removePageListener("prerenderingchange", onVisibilityUpdate, true);
    }
  }
};
const getVisibilityWatcher = () => {
  if (WINDOW$3.document && firstHiddenTime < 0) {
    const activationStart = getActivationStart();
    const firstVisibilityStateHiddenTime = !WINDOW$3.document.prerendering ? globalThis.performance.getEntriesByType("visibility-state").filter((e2) => e2.name === "hidden" && e2.startTime > activationStart)[0]?.startTime : void 0;
    firstHiddenTime = firstVisibilityStateHiddenTime ?? initHiddenTime();
    addPageListener("visibilitychange", onVisibilityUpdate, true);
    addPageListener("pagehide", onVisibilityUpdate, true);
    addPageListener("prerenderingchange", onVisibilityUpdate, true);
  }
  return {
    get firstHiddenTime() {
      return firstHiddenTime;
    },
    onHidden(cb) {
      onHiddenFunctions.add(cb);
    }
  };
};
function isPageHidden(event) {
  return event.type === "pagehide" || WINDOW$3.document?.visibilityState === "hidden";
}
const generateUniqueID = () => {
  return `v5-${Date.now()}-${Math.floor(Math.random() * (9e12 - 1)) + 1e12}`;
};
const initMetric = (name, value = -1) => {
  const navEntry = getNavigationEntry();
  let navigationType = "navigate";
  if (navEntry) {
    if (WINDOW$3.document?.prerendering || getActivationStart() > 0) {
      navigationType = "prerender";
    } else if (WINDOW$3.document?.wasDiscarded) {
      navigationType = "restore";
    } else if (navEntry.type) {
      navigationType = navEntry.type.replace(/_/g, "-");
    }
  }
  const entries = [];
  return {
    name,
    value,
    rating: "good",
    // If needed, will be updated when reported. `const` to keep the type from widening to `string`.
    delta: 0,
    entries,
    id: generateUniqueID(),
    navigationType
  };
};
const instanceMap = /* @__PURE__ */ new WeakMap();
function initUnique(identityObj, ClassObj) {
  try {
    if (!instanceMap.get(identityObj)) {
      instanceMap.set(identityObj, new ClassObj());
    }
    return instanceMap.get(identityObj);
  } catch (_e) {
    return new ClassObj();
  }
}
class LayoutShiftManager {
  constructor() {
    this._sessionValue = 0;
    this._sessionEntries = [];
  }
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  _processEntry(entry) {
    if (entry.hadRecentInput) return;
    const firstSessionEntry = this._sessionEntries[0];
    const lastSessionEntry = this._sessionEntries[this._sessionEntries.length - 1];
    if (this._sessionValue && firstSessionEntry && lastSessionEntry && entry.startTime - lastSessionEntry.startTime < 1e3 && entry.startTime - firstSessionEntry.startTime < 5e3) {
      this._sessionValue += entry.value;
      this._sessionEntries.push(entry);
    } else {
      this._sessionValue = entry.value;
      this._sessionEntries = [entry];
    }
    this._onAfterProcessingUnexpectedShift?.(entry);
  }
}
const observe = (type, callback, opts = {}) => {
  try {
    if (PerformanceObserver.supportedEntryTypes.includes(type)) {
      const po2 = new PerformanceObserver((list) => {
        Promise.resolve().then(() => {
          callback(list.getEntries());
        });
      });
      po2.observe({ type, buffered: true, ...opts });
      return po2;
    }
  } catch {
  }
  return;
};
const runOnce = (cb) => {
  let called = false;
  return () => {
    if (!called) {
      cb();
      called = true;
    }
  };
};
const whenActivated = (callback) => {
  if (WINDOW$3.document?.prerendering) {
    addEventListener("prerenderingchange", () => callback(), true);
  } else {
    callback();
  }
};
const FCPThresholds = [1800, 3e3];
const onFCP = (onReport, opts = {}) => {
  whenActivated(() => {
    const visibilityWatcher = getVisibilityWatcher();
    const metric = initMetric("FCP");
    let report;
    const handleEntries = (entries) => {
      for (const entry of entries) {
        if (entry.name === "first-contentful-paint") {
          po2.disconnect();
          if (entry.startTime < visibilityWatcher.firstHiddenTime) {
            metric.value = Math.max(entry.startTime - getActivationStart(), 0);
            metric.entries.push(entry);
            report(true);
          }
        }
      }
    };
    const po2 = observe("paint", handleEntries);
    if (po2) {
      report = bindReporter(onReport, metric, FCPThresholds, opts.reportAllChanges);
    }
  });
};
const CLSThresholds = [0.1, 0.25];
const onCLS = (onReport, opts = {}) => {
  onFCP(
    runOnce(() => {
      const metric = initMetric("CLS", 0);
      let report;
      const visibilityWatcher = getVisibilityWatcher();
      const layoutShiftManager = initUnique(opts, LayoutShiftManager);
      const handleEntries = (entries) => {
        for (const entry of entries) {
          layoutShiftManager._processEntry(entry);
        }
        if (layoutShiftManager._sessionValue > metric.value) {
          metric.value = layoutShiftManager._sessionValue;
          metric.entries = layoutShiftManager._sessionEntries;
          report();
        }
      };
      const po2 = observe("layout-shift", handleEntries);
      if (po2) {
        report = bindReporter(onReport, metric, CLSThresholds, opts.reportAllChanges);
        visibilityWatcher.onHidden(() => {
          handleEntries(po2.takeRecords());
          report(true);
        });
        WINDOW$3?.setTimeout?.(report);
      }
    })
  );
};
let interactionCountEstimate = 0;
let minKnownInteractionId = Infinity;
let maxKnownInteractionId = 0;
const updateEstimate = (entries) => {
  entries.forEach((e2) => {
    if (e2.interactionId) {
      minKnownInteractionId = Math.min(minKnownInteractionId, e2.interactionId);
      maxKnownInteractionId = Math.max(maxKnownInteractionId, e2.interactionId);
      interactionCountEstimate = maxKnownInteractionId ? (maxKnownInteractionId - minKnownInteractionId) / 7 + 1 : 0;
    }
  });
};
let po;
const getInteractionCount = () => {
  return po ? interactionCountEstimate : performance.interactionCount || 0;
};
const initInteractionCountPolyfill = () => {
  if ("interactionCount" in performance || po) return;
  po = observe("event", updateEstimate, {
    type: "event",
    buffered: true,
    durationThreshold: 0
  });
};
const MAX_INTERACTIONS_TO_CONSIDER = 10;
let prevInteractionCount = 0;
const getInteractionCountForNavigation = () => {
  return getInteractionCount() - prevInteractionCount;
};
class InteractionManager {
  constructor() {
    this._longestInteractionList = [];
    this._longestInteractionMap = /* @__PURE__ */ new Map();
  }
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility, jsdoc/require-jsdoc
  _resetInteractions() {
    prevInteractionCount = getInteractionCount();
    this._longestInteractionList.length = 0;
    this._longestInteractionMap.clear();
  }
  /**
   * Returns the estimated p98 longest interaction based on the stored
   * interaction candidates and the interaction count for the current page.
   */
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  _estimateP98LongestInteraction() {
    const candidateInteractionIndex = Math.min(
      this._longestInteractionList.length - 1,
      Math.floor(getInteractionCountForNavigation() / 50)
    );
    return this._longestInteractionList[candidateInteractionIndex];
  }
  /**
   * Takes a performance entry and adds it to the list of worst interactions
   * if its duration is long enough to make it among the worst. If the
   * entry is part of an existing interaction, it is merged and the latency
   * and entries list is updated as needed.
   */
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  _processEntry(entry) {
    this._onBeforeProcessingEntry?.(entry);
    if (!(entry.interactionId || entry.entryType === "first-input")) return;
    const minLongestInteraction = this._longestInteractionList.at(-1);
    let interaction = this._longestInteractionMap.get(entry.interactionId);
    if (interaction || this._longestInteractionList.length < MAX_INTERACTIONS_TO_CONSIDER || // If the above conditions are false, `minLongestInteraction` will be set.
    entry.duration > minLongestInteraction._latency) {
      if (interaction) {
        if (entry.duration > interaction._latency) {
          interaction.entries = [entry];
          interaction._latency = entry.duration;
        } else if (entry.duration === interaction._latency && entry.startTime === interaction.entries[0].startTime) {
          interaction.entries.push(entry);
        }
      } else {
        interaction = {
          id: entry.interactionId,
          entries: [entry],
          _latency: entry.duration
        };
        this._longestInteractionMap.set(interaction.id, interaction);
        this._longestInteractionList.push(interaction);
      }
      this._longestInteractionList.sort((a2, b2) => b2._latency - a2._latency);
      if (this._longestInteractionList.length > MAX_INTERACTIONS_TO_CONSIDER) {
        const removedInteractions = this._longestInteractionList.splice(MAX_INTERACTIONS_TO_CONSIDER);
        for (const interaction2 of removedInteractions) {
          this._longestInteractionMap.delete(interaction2.id);
        }
      }
      this._onAfterProcessingINPCandidate?.(interaction);
    }
  }
}
const whenIdleOrHidden = (cb) => {
  const rIC = WINDOW$3.requestIdleCallback || WINDOW$3.setTimeout;
  if (WINDOW$3.document?.visibilityState === "hidden") {
    cb();
  } else {
    cb = runOnce(cb);
    addPageListener("visibilitychange", cb, { once: true, capture: true });
    addPageListener("pagehide", cb, { once: true, capture: true });
    rIC(() => {
      cb();
      removePageListener("visibilitychange", cb, { capture: true });
      removePageListener("pagehide", cb, { capture: true });
    });
  }
};
const INPThresholds = [200, 500];
const DEFAULT_DURATION_THRESHOLD = 40;
const onINP = (onReport, opts = {}) => {
  if (!(globalThis.PerformanceEventTiming && "interactionId" in PerformanceEventTiming.prototype)) {
    return;
  }
  const visibilityWatcher = getVisibilityWatcher();
  whenActivated(() => {
    initInteractionCountPolyfill();
    const metric = initMetric("INP");
    let report;
    const interactionManager = initUnique(opts, InteractionManager);
    const handleEntries = (entries) => {
      whenIdleOrHidden(() => {
        for (const entry of entries) {
          interactionManager._processEntry(entry);
        }
        const inp = interactionManager._estimateP98LongestInteraction();
        if (inp && inp._latency !== metric.value) {
          metric.value = inp._latency;
          metric.entries = inp.entries;
          report();
        }
      });
    };
    const po2 = observe("event", handleEntries, {
      // Event Timing entries have their durations rounded to the nearest 8ms,
      // so a duration of 40ms would be any event that spans 2.5 or more frames
      // at 60Hz. This threshold is chosen to strike a balance between usefulness
      // and performance. Running this callback for any interaction that spans
      // just one or two frames is likely not worth the insight that could be
      // gained.
      durationThreshold: opts.durationThreshold ?? DEFAULT_DURATION_THRESHOLD
    });
    report = bindReporter(onReport, metric, INPThresholds, opts.reportAllChanges);
    if (po2) {
      po2.observe({ type: "first-input", buffered: true });
      visibilityWatcher.onHidden(() => {
        handleEntries(po2.takeRecords());
        report(true);
      });
    }
  });
};
class LCPEntryManager {
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility, jsdoc/require-jsdoc
  _processEntry(entry) {
    this._onBeforeProcessingEntry?.(entry);
  }
}
const LCPThresholds = [2500, 4e3];
const onLCP = (onReport, opts = {}) => {
  whenActivated(() => {
    const visibilityWatcher = getVisibilityWatcher();
    const metric = initMetric("LCP");
    let report;
    const lcpEntryManager = initUnique(opts, LCPEntryManager);
    const handleEntries = (entries) => {
      if (!opts.reportAllChanges) {
        entries = entries.slice(-1);
      }
      for (const entry of entries) {
        lcpEntryManager._processEntry(entry);
        if (entry.startTime < visibilityWatcher.firstHiddenTime) {
          metric.value = Math.max(entry.startTime - getActivationStart(), 0);
          metric.entries = [entry];
          report();
        }
      }
    };
    const po2 = observe("largest-contentful-paint", handleEntries);
    if (po2) {
      report = bindReporter(onReport, metric, LCPThresholds, opts.reportAllChanges);
      const stopListening = runOnce(() => {
        handleEntries(po2.takeRecords());
        po2.disconnect();
        report(true);
      });
      const stopListeningWrapper = (event) => {
        if (event.isTrusted) {
          whenIdleOrHidden(stopListening);
          removePageListener(event.type, stopListeningWrapper, {
            capture: true
          });
        }
      };
      for (const type of ["keydown", "click", "visibilitychange"]) {
        addPageListener(type, stopListeningWrapper, {
          capture: true
        });
      }
    }
  });
};
const TTFBThresholds = [800, 1800];
const whenReady = (callback) => {
  if (WINDOW$3.document?.prerendering) {
    whenActivated(() => whenReady(callback));
  } else if (WINDOW$3.document?.readyState !== "complete") {
    addEventListener("load", () => whenReady(callback), true);
  } else {
    setTimeout(callback);
  }
};
const onTTFB = (onReport, opts = {}) => {
  const metric = initMetric("TTFB");
  const report = bindReporter(onReport, metric, TTFBThresholds, opts.reportAllChanges);
  whenReady(() => {
    const navigationEntry = getNavigationEntry();
    if (navigationEntry) {
      metric.value = Math.max(navigationEntry.responseStart - getActivationStart(), 0);
      metric.entries = [navigationEntry];
      report(true);
    }
  });
};
const handlers$1 = {};
const instrumented = {};
let _previousCls;
let _previousLcp;
let _previousTtfb;
let _previousInp;
function addClsInstrumentationHandler(callback, stopOnCallback = false) {
  return addMetricObserver("cls", callback, instrumentCls, _previousCls, stopOnCallback);
}
function addLcpInstrumentationHandler(callback, stopOnCallback = false) {
  return addMetricObserver("lcp", callback, instrumentLcp, _previousLcp, stopOnCallback);
}
function addTtfbInstrumentationHandler(callback) {
  return addMetricObserver("ttfb", callback, instrumentTtfb, _previousTtfb);
}
function addInpInstrumentationHandler(callback) {
  return addMetricObserver("inp", callback, instrumentInp, _previousInp);
}
function addPerformanceInstrumentationHandler(type, callback) {
  addHandler(type, callback);
  if (!instrumented[type]) {
    instrumentPerformanceObserver(type);
    instrumented[type] = true;
  }
  return getCleanupCallback(type, callback);
}
function triggerHandlers(type, data) {
  const typeHandlers = handlers$1[type];
  if (!typeHandlers?.length) {
    return;
  }
  for (const handler of typeHandlers) {
    try {
      handler(data);
    } catch (e2) {
      DEBUG_BUILD$3 && debug$2.error(
        `Error while triggering instrumentation handler.
Type: ${type}
Name: ${getFunctionName(handler)}
Error:`,
        e2
      );
    }
  }
}
function instrumentCls() {
  return onCLS(
    (metric) => {
      triggerHandlers("cls", {
        metric
      });
      _previousCls = metric;
    },
    // We want the callback to be called whenever the CLS value updates.
    // By default, the callback is only called when the tab goes to the background.
    { reportAllChanges: true }
  );
}
function instrumentLcp() {
  return onLCP(
    (metric) => {
      triggerHandlers("lcp", {
        metric
      });
      _previousLcp = metric;
    },
    // We want the callback to be called whenever the LCP value updates.
    // By default, the callback is only called when the tab goes to the background.
    { reportAllChanges: true }
  );
}
function instrumentTtfb() {
  return onTTFB((metric) => {
    triggerHandlers("ttfb", {
      metric
    });
    _previousTtfb = metric;
  });
}
function instrumentInp() {
  return onINP((metric) => {
    triggerHandlers("inp", {
      metric
    });
    _previousInp = metric;
  });
}
function addMetricObserver(type, callback, instrumentFn, previousValue, stopOnCallback = false) {
  addHandler(type, callback);
  let stopListening;
  if (!instrumented[type]) {
    stopListening = instrumentFn();
    instrumented[type] = true;
  }
  if (previousValue) {
    callback({ metric: previousValue });
  }
  return getCleanupCallback(type, callback, stopOnCallback ? stopListening : void 0);
}
function instrumentPerformanceObserver(type) {
  const options = {};
  if (type === "event") {
    options.durationThreshold = 0;
  }
  observe(
    type,
    (entries) => {
      triggerHandlers(type, { entries });
    },
    options
  );
}
function addHandler(type, handler) {
  handlers$1[type] = handlers$1[type] || [];
  handlers$1[type].push(handler);
}
function getCleanupCallback(type, callback, stopListening) {
  return () => {
    if (stopListening) {
      stopListening();
    }
    const typeHandlers = handlers$1[type];
    if (!typeHandlers) {
      return;
    }
    const index = typeHandlers.indexOf(callback);
    if (index !== -1) {
      typeHandlers.splice(index, 1);
    }
  };
}
function isPerformanceEventTiming(entry) {
  return "duration" in entry;
}
const DEFAULT_MAX_STRING_LENGTH = 80;
function htmlTreeAsString(elem, options = {}) {
  if (!elem) {
    return "<unknown>";
  }
  try {
    let currentElem = elem;
    const MAX_TRAVERSE_HEIGHT = 5;
    const out = [];
    let height = 0;
    let len = 0;
    const separator = " > ";
    const sepLength = separator.length;
    let nextStr;
    const keyAttrs = Array.isArray(options) ? options : options.keyAttrs;
    const maxStringLength = !Array.isArray(options) && options.maxStringLength || DEFAULT_MAX_STRING_LENGTH;
    while (currentElem && height++ < MAX_TRAVERSE_HEIGHT) {
      nextStr = _htmlElementAsString(currentElem, keyAttrs);
      if (nextStr === "html" || height > 1 && len + out.length * sepLength + nextStr.length >= maxStringLength) {
        break;
      }
      out.push(nextStr);
      len += nextStr.length;
      currentElem = currentElem.parentNode;
    }
    return out.reverse().join(separator);
  } catch {
    return "<unknown>";
  }
}
function _htmlElementAsString(el, keyAttrs) {
  const elem = el;
  const out = [];
  if (!elem?.tagName) {
    return "";
  }
  if (typeof HTMLElement !== "undefined") {
    if (elem instanceof HTMLElement && elem.dataset) {
      if (elem.dataset["sentryComponent"]) {
        return elem.dataset["sentryComponent"];
      }
      if (elem.dataset["sentryElement"]) {
        return elem.dataset["sentryElement"];
      }
    }
  }
  out.push(elem.tagName.toLowerCase());
  const keyAttrPairs = keyAttrs?.length ? keyAttrs.filter((keyAttr) => elem.getAttribute(keyAttr)).map((keyAttr) => [keyAttr, elem.getAttribute(keyAttr)]) : null;
  if (keyAttrPairs?.length) {
    keyAttrPairs.forEach((keyAttrPair) => {
      out.push(`[${keyAttrPair[0]}="${keyAttrPair[1]}"]`);
    });
  } else {
    if (elem.id) {
      out.push(`#${elem.id}`);
    }
    const className = elem.className;
    if (className && isString(className)) {
      const classes = className.split(/\s+/);
      for (const c2 of classes) {
        out.push(`.${c2}`);
      }
    }
  }
  for (const k2 of ["aria-label", "type", "name", "title", "alt"]) {
    const attr = elem.getAttribute(k2);
    if (attr) {
      out.push(`[${k2}="${attr}"]`);
    }
  }
  return out.join("");
}
const onHidden = (cb) => {
  const onHiddenOrPageHide = (event) => {
    if (event.type === "pagehide" || WINDOW$3.document?.visibilityState === "hidden") {
      cb(event);
    }
  };
  addPageListener("visibilitychange", onHiddenOrPageHide, { capture: true, once: true });
  addPageListener("pagehide", onHiddenOrPageHide, { capture: true, once: true });
};
function isMeasurementValue(value) {
  return typeof value === "number" && isFinite(value);
}
function startAndEndSpan(parentSpan, startTimeInSeconds, endTime, { ...ctx }) {
  const parentStartTime = spanToJSON(parentSpan).start_timestamp;
  if (parentStartTime && parentStartTime > startTimeInSeconds) {
    if (typeof parentSpan.updateStartTime === "function") {
      parentSpan.updateStartTime(startTimeInSeconds);
    }
  }
  return withActiveSpan(parentSpan, () => {
    const span = startInactiveSpan({
      startTime: startTimeInSeconds,
      ...ctx
    });
    if (span) {
      span.end(endTime);
    }
    return span;
  });
}
function startStandaloneWebVitalSpan(options) {
  const client = getClient();
  if (!client) {
    return;
  }
  const { name, transaction, attributes: passedAttributes, startTime } = options;
  const { release, environment } = client.getOptions();
  const { userInfo } = client.getDataCollectionOptions();
  const replay = client.getIntegrationByName("Replay");
  const replayId = replay?.getReplayId();
  const scope = getCurrentScope();
  const user = scope.getUser();
  const userDisplay = user !== void 0 ? user.email || user.id || user.ip_address : void 0;
  let profileId;
  try {
    profileId = scope.getScopeData().contexts.profile.profile_id;
  } catch {
  }
  const attributes = {
    release,
    environment,
    user: userDisplay || void 0,
    profile_id: profileId || void 0,
    replay_id: replayId || void 0,
    transaction,
    // Web vital score calculation relies on the user agent to account for different
    // browsers setting different thresholds for what is considered a good/meh/bad value.
    // For example: Chrome vs. Chrome Mobile
    "user_agent.original": WINDOW$3.navigator?.userAgent,
    // This tells Sentry to infer the IP address from the request
    "client.address": userInfo ? "{{auto}}" : void 0,
    ...passedAttributes
  };
  return startInactiveSpan({
    name,
    attributes,
    startTime,
    experimental: {
      standalone: true
    }
  });
}
function getBrowserPerformanceAPI() {
  return WINDOW$3.addEventListener && WINDOW$3.performance;
}
function msToSec(time) {
  return time / 1e3;
}
function extractNetworkProtocol(nextHopProtocol) {
  let name = "unknown";
  let version = "unknown";
  let _name = "";
  for (const char of nextHopProtocol) {
    if (char === "/") {
      [name, version] = nextHopProtocol.split("/");
      break;
    }
    if (!isNaN(Number(char))) {
      name = _name === "h" ? "http" : _name;
      version = nextHopProtocol.split(_name)[1];
      break;
    }
    _name += char;
  }
  if (_name === nextHopProtocol) {
    name = _name;
  }
  return { name, version };
}
function supportsWebVital(entryType) {
  try {
    return PerformanceObserver.supportedEntryTypes.includes(entryType);
  } catch {
    return false;
  }
}
function listenForWebVitalReportEvents(client, collectorCallback) {
  let pageloadSpan;
  let collected = false;
  function _runCollectorCallbackOnce(event) {
    if (!collected && pageloadSpan) {
      collectorCallback(event, pageloadSpan.spanContext().spanId, pageloadSpan);
    }
    collected = true;
  }
  onHidden(() => {
    _runCollectorCallbackOnce("pagehide");
  });
  const unsubscribeStartNavigation = client.on("beforeStartNavigationSpan", (_2, options) => {
    if (!options?.isRedirect) {
      _runCollectorCallbackOnce("navigation");
      unsubscribeStartNavigation();
      unsubscribeAfterStartPageLoadSpan();
    }
  });
  const unsubscribeAfterStartPageLoadSpan = client.on("afterStartPageLoadSpan", (span) => {
    pageloadSpan = span;
    unsubscribeAfterStartPageLoadSpan();
  });
}
function trackClsAsStandaloneSpan(client) {
  let standaloneCLsValue = 0;
  let standaloneClsEntry;
  if (!supportsWebVital("layout-shift")) {
    return;
  }
  const cleanupClsHandler = addClsInstrumentationHandler(({ metric }) => {
    const entry = metric.entries[metric.entries.length - 1];
    if (!entry) {
      return;
    }
    standaloneCLsValue = metric.value;
    standaloneClsEntry = entry;
  }, true);
  listenForWebVitalReportEvents(client, (reportEvent, pageloadSpanId) => {
    _sendStandaloneClsSpan(standaloneCLsValue, standaloneClsEntry, pageloadSpanId, reportEvent);
    cleanupClsHandler();
  });
}
function _sendStandaloneClsSpan(clsValue, entry, pageloadSpanId, reportEvent) {
  DEBUG_BUILD$3 && debug$2.log(`Sending CLS span (${clsValue})`);
  const startTime = entry ? msToSec((browserPerformanceTimeOrigin() || 0) + entry.startTime) : timestampInSeconds();
  const routeName = getCurrentScope().getScopeData().transactionName;
  const name = entry ? htmlTreeAsString(entry.sources[0]?.node) : "Layout shift";
  const attributes = {
    [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.http.browser.cls",
    [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "ui.webvital.cls",
    [SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME]: 0,
    // attach the pageload span id to the CLS span so that we can link them in the UI
    "sentry.pageload.span_id": pageloadSpanId,
    // describes what triggered the web vital to be reported
    "sentry.report_event": reportEvent
  };
  if (entry?.sources) {
    entry.sources.forEach((source, index) => {
      attributes[`cls.source.${index + 1}`] = htmlTreeAsString(source.node);
    });
  }
  const span = startStandaloneWebVitalSpan({
    name,
    transaction: routeName,
    attributes,
    startTime
  });
  if (span) {
    span.addEvent("cls", {
      [SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_UNIT]: "",
      [SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_VALUE]: clsValue
    });
    span.end(startTime);
  }
}
const MAX_PLAUSIBLE_LCP_DURATION = 6e4;
function isValidLcpMetric(lcpValue) {
  return lcpValue != null && lcpValue > 0 && lcpValue <= MAX_PLAUSIBLE_LCP_DURATION;
}
function trackLcpAsStandaloneSpan(client) {
  let standaloneLcpValue = 0;
  let standaloneLcpEntry;
  if (!supportsWebVital("largest-contentful-paint")) {
    return;
  }
  const cleanupLcpHandler = addLcpInstrumentationHandler(({ metric }) => {
    const entry = metric.entries[metric.entries.length - 1];
    if (!entry || !isValidLcpMetric(metric.value)) {
      return;
    }
    standaloneLcpValue = metric.value;
    standaloneLcpEntry = entry;
  }, true);
  listenForWebVitalReportEvents(client, (reportEvent, pageloadSpanId) => {
    _sendStandaloneLcpSpan(standaloneLcpValue, standaloneLcpEntry, pageloadSpanId, reportEvent);
    cleanupLcpHandler();
  });
}
function _sendStandaloneLcpSpan(lcpValue, entry, pageloadSpanId, reportEvent) {
  if (!isValidLcpMetric(lcpValue)) {
    return;
  }
  DEBUG_BUILD$3 && debug$2.log(`Sending LCP span (${lcpValue})`);
  const startTime = msToSec((browserPerformanceTimeOrigin() || 0) + (entry?.startTime || 0));
  const routeName = getCurrentScope().getScopeData().transactionName;
  const name = entry ? htmlTreeAsString(entry.element) : "Largest contentful paint";
  const attributes = {
    [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.http.browser.lcp",
    [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "ui.webvital.lcp",
    [SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME]: 0,
    // LCP is a point-in-time metric
    // attach the pageload span id to the LCP span so that we can link them in the UI
    "sentry.pageload.span_id": pageloadSpanId,
    // describes what triggered the web vital to be reported
    "sentry.report_event": reportEvent
  };
  if (entry) {
    entry.element && (attributes["lcp.element"] = htmlTreeAsString(entry.element));
    entry.id && (attributes["lcp.id"] = entry.id);
    entry.url && (attributes["lcp.url"] = entry.url);
    entry.loadTime != null && (attributes["lcp.loadTime"] = entry.loadTime);
    entry.renderTime != null && (attributes["lcp.renderTime"] = entry.renderTime);
    entry.size != null && (attributes["lcp.size"] = entry.size);
  }
  const span = startStandaloneWebVitalSpan({
    name,
    transaction: routeName,
    attributes,
    startTime
  });
  if (span) {
    span.addEvent("lcp", {
      [SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_UNIT]: "millisecond",
      [SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_VALUE]: lcpValue
    });
    span.end(startTime);
  }
}
function getAbsoluteTime$1(time) {
  return time ? ((browserPerformanceTimeOrigin() || performance.timeOrigin) + time) / 1e3 : time;
}
function resourceTimingToSpanAttributes(resourceTiming) {
  const timingSpanData = {};
  if (resourceTiming.nextHopProtocol != void 0) {
    const { name, version } = extractNetworkProtocol(resourceTiming.nextHopProtocol);
    timingSpanData["network.protocol.version"] = version;
    timingSpanData["network.protocol.name"] = name;
  }
  if (!(browserPerformanceTimeOrigin() || getBrowserPerformanceAPI()?.timeOrigin)) {
    return timingSpanData;
  }
  return dropUndefinedKeysFromObject({
    ...timingSpanData,
    "http.request.redirect_start": getAbsoluteTime$1(resourceTiming.redirectStart),
    "http.request.redirect_end": getAbsoluteTime$1(resourceTiming.redirectEnd),
    "http.request.worker_start": getAbsoluteTime$1(resourceTiming.workerStart),
    "http.request.fetch_start": getAbsoluteTime$1(resourceTiming.fetchStart),
    "http.request.domain_lookup_start": getAbsoluteTime$1(resourceTiming.domainLookupStart),
    "http.request.domain_lookup_end": getAbsoluteTime$1(resourceTiming.domainLookupEnd),
    "http.request.connect_start": getAbsoluteTime$1(resourceTiming.connectStart),
    "http.request.secure_connection_start": getAbsoluteTime$1(resourceTiming.secureConnectionStart),
    "http.request.connection_end": getAbsoluteTime$1(resourceTiming.connectEnd),
    "http.request.request_start": getAbsoluteTime$1(resourceTiming.requestStart),
    "http.request.response_start": getAbsoluteTime$1(resourceTiming.responseStart),
    "http.request.response_end": getAbsoluteTime$1(resourceTiming.responseEnd),
    // For TTFB we actually want the relative time from timeOrigin to responseStart
    // This way, TTFB always measures the "first page load" experience.
    // see: https://web.dev/articles/ttfb#measure-resource-requests
    "http.request.time_to_first_byte": resourceTiming.responseStart != null ? resourceTiming.responseStart / 1e3 : void 0
  });
}
function dropUndefinedKeysFromObject(attrs) {
  return Object.fromEntries(Object.entries(attrs).filter(([, value]) => value != null));
}
const MAX_INT_AS_BYTES = 2147483647;
let _performanceCursor = 0;
let _measurements = {};
let _lcpEntry;
let _clsEntry;
function startTrackingWebVitals({
  recordClsStandaloneSpans,
  recordLcpStandaloneSpans,
  client
}) {
  const performance2 = getBrowserPerformanceAPI();
  if (performance2 && browserPerformanceTimeOrigin()) {
    if (performance2.mark) {
      WINDOW$3.performance.mark("sentry-tracing-init");
    }
    const lcpCleanupCallback = recordLcpStandaloneSpans ? trackLcpAsStandaloneSpan(client) : recordLcpStandaloneSpans === false ? _trackLCP() : void 0;
    const clsCleanupCallback = recordClsStandaloneSpans ? trackClsAsStandaloneSpan(client) : recordClsStandaloneSpans === false ? _trackCLS() : void 0;
    const ttfbCleanupCallback = _trackTtfb();
    return () => {
      ttfbCleanupCallback();
      lcpCleanupCallback?.();
      clsCleanupCallback?.();
    };
  }
  return () => void 0;
}
function startTrackingLongTasks() {
  addPerformanceInstrumentationHandler("longtask", ({ entries }) => {
    const parent = getActiveSpan();
    if (!parent) {
      return;
    }
    const { op: parentOp, start_timestamp: parentStartTimestamp } = spanToJSON(parent);
    for (const entry of entries) {
      const startTime = msToSec(browserPerformanceTimeOrigin() + entry.startTime);
      const duration = msToSec(entry.duration);
      if (parentOp === "navigation" && parentStartTimestamp && startTime < parentStartTimestamp) {
        continue;
      }
      startAndEndSpan(parent, startTime, startTime + duration, {
        name: "Main UI thread blocked",
        op: "ui.long-task",
        attributes: {
          [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ui.browser.metrics"
        }
      });
    }
  });
}
function startTrackingLongAnimationFrames() {
  const observer = new PerformanceObserver((list) => {
    const parent = getActiveSpan();
    if (!parent) {
      return;
    }
    for (const entry of list.getEntries()) {
      if (!entry.scripts[0]) {
        continue;
      }
      const startTime = msToSec(browserPerformanceTimeOrigin() + entry.startTime);
      const { start_timestamp: parentStartTimestamp, op: parentOp } = spanToJSON(parent);
      if (parentOp === "navigation" && parentStartTimestamp && startTime < parentStartTimestamp) {
        continue;
      }
      const duration = msToSec(entry.duration);
      const attributes = {
        [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ui.browser.metrics"
      };
      const initialScript = entry.scripts[0];
      const { invoker, invokerType, sourceURL, sourceFunctionName, sourceCharPosition } = initialScript;
      attributes["browser.script.invoker"] = invoker;
      attributes["browser.script.invoker_type"] = invokerType;
      if (sourceURL) {
        attributes["code.filepath"] = sourceURL;
      }
      if (sourceFunctionName) {
        attributes["code.function"] = sourceFunctionName;
      }
      if (sourceCharPosition !== -1) {
        attributes["browser.script.source_char_position"] = sourceCharPosition;
      }
      startAndEndSpan(parent, startTime, startTime + duration, {
        name: "Main UI thread blocked",
        op: "ui.long-animation-frame",
        attributes
      });
    }
  });
  observer.observe({ type: "long-animation-frame", buffered: true });
}
function startTrackingInteractions() {
  addPerformanceInstrumentationHandler("event", ({ entries }) => {
    const parent = getActiveSpan();
    if (!parent) {
      return;
    }
    for (const entry of entries) {
      if (entry.name === "click") {
        const startTime = msToSec(browserPerformanceTimeOrigin() + entry.startTime);
        const duration = msToSec(entry.duration);
        const spanOptions = {
          name: htmlTreeAsString(entry.target),
          op: `ui.interaction.${entry.name}`,
          startTime,
          attributes: {
            [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ui.browser.metrics"
          }
        };
        const componentName = getComponentName(entry.target);
        if (componentName) {
          spanOptions.attributes["ui.component_name"] = componentName;
        }
        startAndEndSpan(parent, startTime, startTime + duration, spanOptions);
      }
    }
  });
}
function _trackCLS() {
  return addClsInstrumentationHandler(({ metric }) => {
    const entry = metric.entries[metric.entries.length - 1];
    if (!entry) {
      return;
    }
    _measurements["cls"] = { value: metric.value, unit: "" };
    _clsEntry = entry;
  }, true);
}
function _trackLCP() {
  return addLcpInstrumentationHandler(({ metric }) => {
    const entry = metric.entries[metric.entries.length - 1];
    if (!entry || !isValidLcpMetric(metric.value)) {
      return;
    }
    _measurements["lcp"] = { value: metric.value, unit: "millisecond" };
    _lcpEntry = entry;
  }, true);
}
function _trackTtfb() {
  return addTtfbInstrumentationHandler(({ metric }) => {
    const entry = metric.entries[metric.entries.length - 1];
    if (!entry) {
      return;
    }
    _measurements["ttfb"] = { value: metric.value, unit: "millisecond" };
  });
}
function addPerformanceEntries(span, options) {
  const performance2 = getBrowserPerformanceAPI();
  const origin = browserPerformanceTimeOrigin();
  if (!performance2?.getEntries || !origin) {
    return;
  }
  const {
    spanStreamingEnabled,
    ignorePerformanceApiSpans,
    ignoreResourceSpans,
    recordClsOnPageloadSpan,
    recordLcpOnPageloadSpan
  } = options;
  const timeOrigin = msToSec(origin);
  const performanceEntries = performance2.getEntries();
  const { op, start_timestamp: transactionStartTime } = spanToJSON(span);
  performanceEntries.slice(_performanceCursor).forEach((entry) => {
    const startTime = msToSec(entry.startTime);
    const duration = msToSec(
      // Inexplicably, Chrome sometimes emits a negative duration. We need to work around this.
      // There is a SO post attempting to explain this, but it leaves one with open questions: https://stackoverflow.com/questions/23191918/peformance-getentries-and-negative-duration-display
      // The way we clamp the value is probably not accurate, since we have observed this happen for things that may take a while to load, like for example the replay worker.
      // TODO: Investigate why this happens and how to properly mitigate. For now, this is a workaround to prevent transactions being dropped due to negative duration spans.
      Math.max(0, entry.duration)
    );
    if (op === "navigation" && transactionStartTime && timeOrigin + startTime < transactionStartTime) {
      return;
    }
    switch (entry.entryType) {
      case "navigation": {
        _addNavigationSpans(span, entry, timeOrigin);
        break;
      }
      case "mark":
      case "paint":
      case "measure": {
        _addMeasureSpans(span, entry, startTime, duration, timeOrigin, ignorePerformanceApiSpans);
        const firstHidden = getVisibilityWatcher();
        const shouldRecord = entry.startTime < firstHidden.firstHiddenTime;
        if (entry.name === "first-paint" && shouldRecord) {
          _measurements["fp"] = { value: entry.startTime, unit: "millisecond" };
        }
        if (entry.name === "first-contentful-paint" && shouldRecord) {
          _measurements["fcp"] = { value: entry.startTime, unit: "millisecond" };
        }
        break;
      }
      case "resource": {
        _addResourceSpans(
          span,
          entry,
          entry.name,
          startTime,
          duration,
          timeOrigin,
          ignoreResourceSpans
        );
        break;
      }
    }
  });
  _performanceCursor = Math.max(performanceEntries.length - 1, 0);
  _trackNavigator(span, spanStreamingEnabled);
  if (op === "pageload") {
    _addTtfbRequestTimeToMeasurements(_measurements);
    if (spanStreamingEnabled) {
      const setAttr = (shortWebVitalName, value, customAttrName) => {
        const attrKey = customAttrName ?? `browser.web_vital.${shortWebVitalName}.value`;
        span.setAttribute(attrKey, value);
        DEBUG_BUILD$3 && debug$2.log("Setting web vital attribute", { [attrKey]: value }, "on pageload span");
      };
      ["ttfb", "fp", "fcp"].forEach((measurementName) => {
        if (_measurements[measurementName]) {
          setAttr(measurementName, _measurements[measurementName].value);
        }
      });
      if (_measurements["ttfb.requestTime"]) {
        setAttr("ttfb.requestTime", _measurements["ttfb.requestTime"].value, "browser.web_vital.ttfb.request_time");
      }
    } else {
      if (!recordClsOnPageloadSpan) {
        delete _measurements.cls;
      }
      if (!recordLcpOnPageloadSpan) {
        delete _measurements.lcp;
      }
      Object.entries(_measurements).forEach(([measurementName, measurement]) => {
        setMeasurement(measurementName, measurement.value, measurement.unit);
      });
      _setWebVitalAttributes(span, options);
    }
    span.setAttribute(spanStreamingEnabled ? "browser.performance.time_origin" : "performance.timeOrigin", timeOrigin);
    span.setAttribute(
      spanStreamingEnabled ? "browser.performance.navigation.activation_start" : "performance.activationStart",
      getActivationStart()
    );
  }
  _lcpEntry = void 0;
  _clsEntry = void 0;
  _measurements = {};
}
function isReact19MeasureEntry(entry) {
  if (entry?.entryType !== "measure") {
    return;
  }
  try {
    return entry.detail.devtools.track === "Components ⚛";
  } catch {
    return;
  }
}
function _addMeasureSpans(span, entry, startTime, duration, timeOrigin, ignorePerformanceApiSpans) {
  if (isReact19MeasureEntry(entry)) {
    return;
  }
  if (["mark", "measure"].includes(entry.entryType) && stringMatchesSomePattern(entry.name, ignorePerformanceApiSpans)) {
    return;
  }
  const navEntry = getNavigationEntry(false);
  const requestTime = msToSec(navEntry ? navEntry.requestStart : 0);
  const measureStartTimestamp = timeOrigin + Math.max(startTime, requestTime);
  const startTimeStamp = timeOrigin + startTime;
  const measureEndTimestamp = startTimeStamp + duration;
  const attributes = {
    [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.resource.browser.metrics"
  };
  if (measureStartTimestamp !== startTimeStamp) {
    attributes["sentry.browser.measure_happened_before_request"] = true;
    attributes["sentry.browser.measure_start_time"] = measureStartTimestamp;
  }
  _addDetailToSpanAttributes(attributes, entry);
  if (measureStartTimestamp <= measureEndTimestamp) {
    startAndEndSpan(span, measureStartTimestamp, measureEndTimestamp, {
      name: entry.name,
      op: entry.entryType,
      attributes
    });
  }
}
function _addDetailToSpanAttributes(attributes, performanceMeasure) {
  try {
    const detail = performanceMeasure.detail;
    if (!detail) {
      return;
    }
    if (typeof detail === "object") {
      for (const [key, value] of Object.entries(detail)) {
        if (value && isPrimitive(value)) {
          attributes[`sentry.browser.measure.detail.${key}`] = value;
        } else if (value !== void 0) {
          try {
            attributes[`sentry.browser.measure.detail.${key}`] = JSON.stringify(value);
          } catch {
          }
        }
      }
      return;
    }
    if (isPrimitive(detail)) {
      attributes["sentry.browser.measure.detail"] = detail;
      return;
    }
    try {
      attributes["sentry.browser.measure.detail"] = JSON.stringify(detail);
    } catch {
    }
  } catch {
  }
}
function _addNavigationSpans(span, entry, timeOrigin) {
  ["unloadEvent", "redirect", "domContentLoadedEvent", "loadEvent", "connect"].forEach((event) => {
    _addPerformanceNavigationTiming(span, entry, event, timeOrigin);
  });
  _addPerformanceNavigationTiming(span, entry, "secureConnection", timeOrigin, "TLS/SSL");
  _addPerformanceNavigationTiming(span, entry, "fetch", timeOrigin, "cache");
  _addPerformanceNavigationTiming(span, entry, "domainLookup", timeOrigin, "DNS");
  _addRequest(span, entry, timeOrigin);
}
function _addPerformanceNavigationTiming(span, entry, event, timeOrigin, name = event) {
  const eventEnd = _getEndPropertyNameForNavigationTiming(event);
  const end = entry[eventEnd];
  const start = entry[`${event}Start`];
  if (!start || !end) {
    return;
  }
  startAndEndSpan(span, timeOrigin + msToSec(start), timeOrigin + msToSec(end), {
    op: `browser.${name}`,
    name: entry.name,
    attributes: {
      [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ui.browser.metrics",
      ...event === "redirect" && entry.redirectCount != null ? { "http.redirect_count": entry.redirectCount } : {}
    }
  });
}
function _getEndPropertyNameForNavigationTiming(event) {
  if (event === "secureConnection") {
    return "connectEnd";
  }
  if (event === "fetch") {
    return "domainLookupStart";
  }
  return `${event}End`;
}
function _addRequest(span, entry, timeOrigin) {
  const requestStartTimestamp = timeOrigin + msToSec(entry.requestStart);
  const responseEndTimestamp = timeOrigin + msToSec(entry.responseEnd);
  const responseStartTimestamp = timeOrigin + msToSec(entry.responseStart);
  if (entry.responseEnd) {
    startAndEndSpan(span, requestStartTimestamp, responseEndTimestamp, {
      op: "browser.request",
      name: entry.name,
      attributes: {
        [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ui.browser.metrics"
      }
    });
    startAndEndSpan(span, responseStartTimestamp, responseEndTimestamp, {
      op: "browser.response",
      name: entry.name,
      attributes: {
        [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ui.browser.metrics"
      }
    });
  }
}
function _addResourceSpans(span, entry, resourceUrl, startTime, duration, timeOrigin, ignoredResourceSpanOps) {
  if (entry.initiatorType === "xmlhttprequest" || entry.initiatorType === "fetch") {
    return;
  }
  const op = entry.initiatorType ? `resource.${entry.initiatorType}` : "resource.other";
  if (ignoredResourceSpanOps?.includes(op)) {
    return;
  }
  const attributes = {
    [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.resource.browser.metrics"
  };
  const parsedUrl = parseUrl(resourceUrl);
  if (parsedUrl.protocol) {
    attributes["url.scheme"] = parsedUrl.protocol.split(":").pop();
  }
  if (parsedUrl.host) {
    attributes["server.address"] = parsedUrl.host;
  }
  attributes["url.same_origin"] = resourceUrl.includes(WINDOW$3.location.origin);
  _setResourceRequestAttributes(entry, attributes, [
    // https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/responseStatus
    ["responseStatus", "http.response.status_code"],
    ["transferSize", "http.response_transfer_size"],
    ["encodedBodySize", "http.response_content_length"],
    ["decodedBodySize", "http.decoded_response_content_length"],
    // https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/renderBlockingStatus
    ["renderBlockingStatus", "resource.render_blocking_status"],
    // https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/deliveryType
    ["deliveryType", "http.response_delivery_type"]
  ]);
  const attributesWithResourceTiming = { ...attributes, ...resourceTimingToSpanAttributes(entry) };
  const startTimestamp = timeOrigin + startTime;
  const endTimestamp = startTimestamp + duration;
  startAndEndSpan(span, startTimestamp, endTimestamp, {
    name: resourceUrl.replace(WINDOW$3.location.origin, ""),
    op,
    attributes: attributesWithResourceTiming
  });
}
function _trackNavigator(span, spanStreamingEnabled) {
  const navigator2 = WINDOW$3.navigator;
  if (!navigator2) {
    return;
  }
  const connection = navigator2.connection;
  if (connection) {
    if (connection.effectiveType) {
      span.setAttribute(
        spanStreamingEnabled ? "network.connection.effective_type" : "effectiveConnectionType",
        connection.effectiveType
      );
    }
    if (connection.type) {
      span.setAttribute(spanStreamingEnabled ? "network.connection.type" : "connectionType", connection.type);
    }
    if (isMeasurementValue(connection.rtt)) {
      _measurements["connection.rtt"] = { value: connection.rtt, unit: "millisecond" };
      if (spanStreamingEnabled) {
        span.setAttribute("network.connection.rtt", connection.rtt);
      }
    }
  }
  if (isMeasurementValue(navigator2.deviceMemory)) {
    if (spanStreamingEnabled) {
      span.setAttribute("device.memory.estimated_capacity", navigator2.deviceMemory);
    } else {
      span.setAttribute("deviceMemory", `${navigator2.deviceMemory} GB`);
    }
  }
  if (isMeasurementValue(navigator2.hardwareConcurrency)) {
    if (spanStreamingEnabled) {
      span.setAttribute("device.processor_count", navigator2.hardwareConcurrency);
    } else {
      span.setAttribute("hardwareConcurrency", String(navigator2.hardwareConcurrency));
    }
  }
}
function _setWebVitalAttributes(span, options) {
  if (_lcpEntry && options.recordLcpOnPageloadSpan) {
    if (_lcpEntry.element) {
      span.setAttribute("lcp.element", htmlTreeAsString(_lcpEntry.element));
    }
    if (_lcpEntry.id) {
      span.setAttribute("lcp.id", _lcpEntry.id);
    }
    if (_lcpEntry.url) {
      span.setAttribute("lcp.url", _lcpEntry.url.trim().slice(0, 200));
    }
    if (_lcpEntry.loadTime != null) {
      span.setAttribute("lcp.loadTime", _lcpEntry.loadTime);
    }
    if (_lcpEntry.renderTime != null) {
      span.setAttribute("lcp.renderTime", _lcpEntry.renderTime);
    }
    span.setAttribute("lcp.size", _lcpEntry.size);
  }
  if (_clsEntry?.sources && options.recordClsOnPageloadSpan) {
    _clsEntry.sources.forEach(
      (source, index) => span.setAttribute(`cls.source.${index + 1}`, htmlTreeAsString(source.node))
    );
  }
}
function _setResourceRequestAttributes(entry, attributes, properties) {
  properties.forEach(([entryKey, attributeKey]) => {
    const entryVal = entry[entryKey];
    if (entryVal != null && (typeof entryVal === "number" && entryVal < MAX_INT_AS_BYTES || typeof entryVal === "string")) {
      attributes[attributeKey] = entryVal;
    }
  });
}
function _addTtfbRequestTimeToMeasurements(_measurements2) {
  const navEntry = getNavigationEntry(false);
  if (!navEntry) {
    return;
  }
  const { responseStart, requestStart } = navEntry;
  if (requestStart <= responseStart) {
    _measurements2["ttfb.requestTime"] = {
      value: responseStart - requestStart,
      unit: "millisecond"
    };
  }
}
const INTEGRATION_NAME$d = "ElementTiming";
const _elementTimingIntegration = (() => {
  return {
    name: INTEGRATION_NAME$d,
    setup() {
      const performance2 = getBrowserPerformanceAPI();
      if (!performance2 || !browserPerformanceTimeOrigin()) {
        return;
      }
      addPerformanceInstrumentationHandler("element", ({ entries }) => {
        for (const entry of entries) {
          const elementEntry = entry;
          if (!elementEntry.identifier) {
            continue;
          }
          const identifier = elementEntry.identifier;
          const paintType = elementEntry.name;
          const renderTime = elementEntry.renderTime;
          const loadTime = elementEntry.loadTime;
          const metricAttributes = {
            "sentry.origin": "auto.ui.browser.element_timing",
            "ui.element.identifier": identifier
          };
          if (paintType) {
            metricAttributes["ui.element.paint_type"] = paintType;
          }
          if (elementEntry.id) {
            metricAttributes["ui.element.id"] = elementEntry.id;
          }
          if (elementEntry.element) {
            metricAttributes["ui.element.type"] = elementEntry.element.tagName.toLowerCase();
          }
          if (elementEntry.url) {
            metricAttributes["ui.element.url"] = elementEntry.url;
          }
          if (elementEntry.naturalWidth) {
            metricAttributes["ui.element.width"] = elementEntry.naturalWidth;
          }
          if (elementEntry.naturalHeight) {
            metricAttributes["ui.element.height"] = elementEntry.naturalHeight;
          }
          if (renderTime > 0) {
            distribution(`ui.element.render_time`, renderTime, {
              unit: "millisecond",
              attributes: metricAttributes
            });
          }
          if (loadTime > 0) {
            distribution(`ui.element.load_time`, loadTime, {
              unit: "millisecond",
              attributes: metricAttributes
            });
          }
        }
      });
    }
  };
});
const elementTimingIntegration = defineIntegration(_elementTimingIntegration);
const LAST_INTERACTIONS = [];
const INTERACTIONS_SPAN_MAP = /* @__PURE__ */ new Map();
const ELEMENT_NAME_TIMESTAMP_MAP = /* @__PURE__ */ new Map();
const MAX_PLAUSIBLE_INP_DURATION = 60;
function startTrackingINP() {
  const performance2 = getBrowserPerformanceAPI();
  if (performance2 && browserPerformanceTimeOrigin()) {
    const inpCallback = _trackINP();
    return () => {
      inpCallback();
    };
  }
  return () => void 0;
}
const INP_ENTRY_MAP = {
  click: "click",
  pointerdown: "click",
  pointerup: "click",
  mousedown: "click",
  mouseup: "click",
  touchstart: "click",
  touchend: "click",
  mouseover: "hover",
  mouseout: "hover",
  mouseenter: "hover",
  mouseleave: "hover",
  pointerover: "hover",
  pointerout: "hover",
  pointerenter: "hover",
  pointerleave: "hover",
  dragstart: "drag",
  dragend: "drag",
  drag: "drag",
  dragenter: "drag",
  dragleave: "drag",
  dragover: "drag",
  drop: "drag",
  keydown: "press",
  keyup: "press",
  keypress: "press",
  input: "press"
};
function _trackINP() {
  return addInpInstrumentationHandler(_onInp);
}
const _onInp = ({ metric }) => {
  if (metric.value == void 0) {
    return;
  }
  const duration = msToSec(metric.value);
  if (duration > MAX_PLAUSIBLE_INP_DURATION) {
    return;
  }
  const entry = metric.entries.find((entry2) => entry2.duration === metric.value && INP_ENTRY_MAP[entry2.name]);
  if (!entry) {
    return;
  }
  const { interactionId } = entry;
  const interactionType = INP_ENTRY_MAP[entry.name];
  const startTime = msToSec(browserPerformanceTimeOrigin() + entry.startTime);
  const activeSpan = getActiveSpan();
  const rootSpan = activeSpan ? getRootSpan(activeSpan) : void 0;
  const cachedInteractionContext = interactionId != null ? INTERACTIONS_SPAN_MAP.get(interactionId) : void 0;
  const spanToUse = cachedInteractionContext?.span || rootSpan;
  const routeName = spanToUse ? spanToJSON(spanToUse).description : getCurrentScope().getScopeData().transactionName;
  const name = cachedInteractionContext?.elementName || htmlTreeAsString(entry.target);
  const attributes = {
    [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.http.browser.inp",
    [SEMANTIC_ATTRIBUTE_SENTRY_OP]: `ui.interaction.${interactionType}`,
    [SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME]: entry.duration
  };
  const span = startStandaloneWebVitalSpan({
    name,
    transaction: routeName,
    attributes,
    startTime
  });
  if (span) {
    span.addEvent("inp", {
      [SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_UNIT]: "millisecond",
      [SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_VALUE]: metric.value
    });
    span.end(startTime + duration);
  }
};
function getCachedInteractionContext(interactionId) {
  return interactionId != null ? INTERACTIONS_SPAN_MAP.get(interactionId) : void 0;
}
function registerInpInteractionListener() {
  const interactionEvents = Object.keys(INP_ENTRY_MAP);
  if (isBrowser()) {
    interactionEvents.forEach((eventType) => {
      WINDOW$3.addEventListener(eventType, captureElementFromEvent, { capture: true, passive: true });
    });
  }
  function captureElementFromEvent(event) {
    const target = event.target;
    if (!target) {
      return;
    }
    const elementName = htmlTreeAsString(target);
    const timestamp = Math.round(event.timeStamp);
    ELEMENT_NAME_TIMESTAMP_MAP.set(timestamp, elementName);
    if (ELEMENT_NAME_TIMESTAMP_MAP.size > 50) {
      const firstKey = ELEMENT_NAME_TIMESTAMP_MAP.keys().next().value;
      if (firstKey !== void 0) {
        ELEMENT_NAME_TIMESTAMP_MAP.delete(firstKey);
      }
    }
  }
  function resolveElementNameFromEntry(entry) {
    const timestamp = Math.round(entry.startTime);
    let elementName = ELEMENT_NAME_TIMESTAMP_MAP.get(timestamp);
    if (!elementName) {
      for (let offset = -5; offset <= 5; offset++) {
        const nearbyName = ELEMENT_NAME_TIMESTAMP_MAP.get(timestamp + offset);
        if (nearbyName) {
          elementName = nearbyName;
          break;
        }
      }
    }
    return elementName || "<unknown>";
  }
  const handleEntries = ({ entries }) => {
    const activeSpan = getActiveSpan();
    const activeRootSpan = activeSpan && getRootSpan(activeSpan);
    entries.forEach((entry) => {
      if (!isPerformanceEventTiming(entry)) {
        return;
      }
      const interactionId = entry.interactionId;
      if (interactionId == null) {
        return;
      }
      if (INTERACTIONS_SPAN_MAP.has(interactionId)) {
        return;
      }
      const elementName = entry.target ? htmlTreeAsString(entry.target) : resolveElementNameFromEntry(entry);
      if (LAST_INTERACTIONS.length > 10) {
        const last = LAST_INTERACTIONS.shift();
        INTERACTIONS_SPAN_MAP.delete(last);
      }
      LAST_INTERACTIONS.push(interactionId);
      INTERACTIONS_SPAN_MAP.set(interactionId, {
        span: activeRootSpan,
        elementName
      });
    });
  };
  addPerformanceInstrumentationHandler("event", handleEntries);
  addPerformanceInstrumentationHandler("first-input", handleEntries);
}
function _emitWebVitalSpan(options) {
  const {
    name,
    op,
    origin,
    metricName,
    value,
    attributes: passedAttributes,
    parentSpan,
    reportEvent,
    startTime,
    endTime
  } = options;
  const routeName = getCurrentScope().getScopeData().transactionName;
  const attributes = {
    [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: origin,
    [SEMANTIC_ATTRIBUTE_SENTRY_OP]: op,
    [SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME]: 0,
    [`browser.web_vital.${metricName}.value`]: value,
    "sentry.transaction": routeName,
    // Web vital score calculation relies on the user agent
    "user_agent.original": WINDOW$3.navigator?.userAgent,
    ...passedAttributes
  };
  if (parentSpan && spanToStreamedSpanJSON(parentSpan).attributes?.[SEMANTIC_ATTRIBUTE_SENTRY_OP] === "pageload") {
    attributes["sentry.pageload.span_id"] = parentSpan.spanContext().spanId;
  }
  if (reportEvent) {
    attributes[`browser.web_vital.${metricName}.report_event`] = reportEvent;
  }
  const span = startInactiveSpan({
    name,
    attributes,
    startTime,
    // if we have a pageload span, we let the web vital span start as its parent. This ensures that
    // it is not started as a segment span, without having to manually set it to a "standalone" v2 span
    // that has `segment: false` but no actual parent span.
    parentSpan
  });
  if (span) {
    span.end(endTime ?? startTime);
  }
}
function trackLcpAsSpan(client) {
  let lcpValue = 0;
  let lcpEntry;
  if (!supportsWebVital("largest-contentful-paint")) {
    return;
  }
  const cleanupLcpHandler = addLcpInstrumentationHandler(({ metric }) => {
    const entry = metric.entries[metric.entries.length - 1];
    if (!entry || !isValidLcpMetric(metric.value)) {
      return;
    }
    lcpValue = metric.value;
    lcpEntry = entry;
  }, true);
  listenForWebVitalReportEvents(client, (reportEvent, _2, pageloadSpan) => {
    _sendLcpSpan(lcpValue, lcpEntry, pageloadSpan, reportEvent);
    cleanupLcpHandler();
  });
}
function _sendLcpSpan(lcpValue, entry, pageloadSpan, reportEvent) {
  if (!isValidLcpMetric(lcpValue)) {
    return;
  }
  DEBUG_BUILD$3 && debug$2.log(`Sending LCP span (${lcpValue})`);
  const performanceTimeOrigin = browserPerformanceTimeOrigin() || 0;
  const timeOrigin = msToSec(performanceTimeOrigin);
  const endTime = msToSec(performanceTimeOrigin + (entry?.startTime || 0));
  const name = entry ? htmlTreeAsString(entry.element) : "Largest contentful paint";
  const attributes = {};
  entry?.element && (attributes["browser.web_vital.lcp.element"] = htmlTreeAsString(entry.element));
  entry?.id && (attributes["browser.web_vital.lcp.id"] = entry.id);
  entry?.url && (attributes["browser.web_vital.lcp.url"] = entry.url);
  entry?.loadTime != null && (attributes["browser.web_vital.lcp.load_time"] = entry.loadTime);
  entry?.renderTime != null && (attributes["browser.web_vital.lcp.render_time"] = entry.renderTime);
  entry?.size != null && (attributes["browser.web_vital.lcp.size"] = entry.size);
  _emitWebVitalSpan({
    name,
    op: "ui.webvital.lcp",
    origin: "auto.http.browser.lcp",
    metricName: "lcp",
    value: lcpValue,
    attributes,
    parentSpan: pageloadSpan,
    reportEvent,
    startTime: timeOrigin,
    endTime
  });
}
function trackClsAsSpan(client) {
  let clsValue = 0;
  let clsEntry;
  if (!supportsWebVital("layout-shift")) {
    return;
  }
  const cleanupClsHandler = addClsInstrumentationHandler(({ metric }) => {
    const entry = metric.entries[metric.entries.length - 1];
    if (!entry) {
      return;
    }
    clsValue = metric.value;
    clsEntry = entry;
  }, true);
  listenForWebVitalReportEvents(client, (reportEvent, _2, pageloadSpan) => {
    _sendClsSpan(clsValue, clsEntry, pageloadSpan, reportEvent);
    cleanupClsHandler();
  });
}
function _sendClsSpan(clsValue, entry, pageloadSpan, reportEvent) {
  DEBUG_BUILD$3 && debug$2.log(`Sending CLS span (${clsValue})`);
  const startTime = entry ? msToSec((browserPerformanceTimeOrigin() || 0) + entry.startTime) : timestampInSeconds();
  const name = entry ? htmlTreeAsString(entry.sources[0]?.node) : "Layout shift";
  const attributes = {};
  if (entry?.sources) {
    entry.sources.forEach((source, index) => {
      attributes[`browser.web_vital.cls.source.${index + 1}`] = htmlTreeAsString(source.node);
    });
  }
  _emitWebVitalSpan({
    name,
    op: "ui.webvital.cls",
    origin: "auto.http.browser.cls",
    metricName: "cls",
    value: clsValue,
    attributes,
    parentSpan: pageloadSpan,
    reportEvent,
    startTime
  });
}
function trackInpAsSpan() {
  const performance2 = getBrowserPerformanceAPI();
  if (!performance2 || !browserPerformanceTimeOrigin()) {
    return;
  }
  const onInp = ({ metric }) => {
    if (metric.value == null) {
      return;
    }
    const duration = msToSec(metric.value);
    if (duration > MAX_PLAUSIBLE_INP_DURATION) {
      return;
    }
    const entry = metric.entries.find((e2) => e2.duration === metric.value && INP_ENTRY_MAP[e2.name]);
    if (!entry) {
      return;
    }
    _sendInpSpan(metric.value, entry);
  };
  addInpInstrumentationHandler(onInp);
}
function _sendInpSpan(inpValue, entry) {
  DEBUG_BUILD$3 && debug$2.log(`Sending INP span (${inpValue})`);
  const startTime = msToSec(browserPerformanceTimeOrigin() + entry.startTime);
  const duration = msToSec(inpValue);
  const interactionType = INP_ENTRY_MAP[entry.name];
  const cachedContext = getCachedInteractionContext(entry.interactionId);
  const activeSpan = getActiveSpan();
  const rootSpan = activeSpan ? getRootSpan(activeSpan) : void 0;
  const spanToUse = cachedContext?.span || rootSpan;
  const routeName = spanToUse ? spanToStreamedSpanJSON(spanToUse).name : getCurrentScope().getScopeData().transactionName;
  const name = cachedContext?.elementName || htmlTreeAsString(entry.target);
  _emitWebVitalSpan({
    name,
    op: `ui.interaction.${interactionType}`,
    origin: "auto.http.browser.inp",
    metricName: "inp",
    value: inpValue,
    attributes: {
      [SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME]: entry.duration,
      "sentry.transaction": routeName
    },
    startTime,
    endTime: startTime + duration,
    parentSpan: spanToUse
  });
}
const DEBOUNCE_DURATION = 1e3;
let debounceTimerID;
let lastCapturedEventType;
let lastCapturedEventTargetId;
function addClickKeypressInstrumentationHandler(handler) {
  const type = "dom";
  addHandler$1(type, handler);
  maybeInstrument(type, instrumentDOM);
}
function instrumentDOM() {
  if (!WINDOW$3.document) {
    return;
  }
  const triggerDOMHandler = triggerHandlers$1.bind(null, "dom");
  const globalDOMEventHandler = makeDOMEventHandler(triggerDOMHandler, true);
  WINDOW$3.document.addEventListener("click", globalDOMEventHandler, false);
  WINDOW$3.document.addEventListener("keypress", globalDOMEventHandler, false);
  ["EventTarget", "Node"].forEach((target) => {
    const globalObject = WINDOW$3;
    const proto = globalObject[target]?.prototype;
    if (!proto?.hasOwnProperty?.("addEventListener")) {
      return;
    }
    fill(proto, "addEventListener", function(originalAddEventListener) {
      return function(type, listener, options) {
        if (type === "click" || type == "keypress") {
          try {
            const handlers2 = this.__sentry_instrumentation_handlers__ = this.__sentry_instrumentation_handlers__ || {};
            const handlerForType = handlers2[type] = handlers2[type] || { refCount: 0 };
            if (!handlerForType.handler) {
              const handler = makeDOMEventHandler(triggerDOMHandler);
              handlerForType.handler = handler;
              originalAddEventListener.call(this, type, handler, options);
            }
            handlerForType.refCount++;
          } catch {
          }
        }
        return originalAddEventListener.call(this, type, listener, options);
      };
    });
    fill(
      proto,
      "removeEventListener",
      function(originalRemoveEventListener) {
        return function(type, listener, options) {
          if (type === "click" || type == "keypress") {
            try {
              const handlers2 = this.__sentry_instrumentation_handlers__ || {};
              const handlerForType = handlers2[type];
              if (handlerForType) {
                handlerForType.refCount--;
                if (handlerForType.refCount <= 0) {
                  originalRemoveEventListener.call(this, type, handlerForType.handler, options);
                  handlerForType.handler = void 0;
                  delete handlers2[type];
                }
                if (Object.keys(handlers2).length === 0) {
                  delete this.__sentry_instrumentation_handlers__;
                }
              }
            } catch {
            }
          }
          return originalRemoveEventListener.call(this, type, listener, options);
        };
      }
    );
  });
}
function isSimilarToLastCapturedEvent(event) {
  if (event.type !== lastCapturedEventType) {
    return false;
  }
  try {
    if (!event.target || event.target._sentryId !== lastCapturedEventTargetId) {
      return false;
    }
  } catch {
  }
  return true;
}
function shouldSkipDOMEvent(eventType, target) {
  if (eventType !== "keypress") {
    return false;
  }
  if (!target?.tagName) {
    return true;
  }
  if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
    return false;
  }
  return true;
}
function makeDOMEventHandler(handler, globalListener = false) {
  return (event) => {
    if (!event || event["_sentryCaptured"]) {
      return;
    }
    const target = getEventTarget$1(event);
    if (shouldSkipDOMEvent(event.type, target)) {
      return;
    }
    addNonEnumerableProperty(event, "_sentryCaptured", true);
    if (target && !target._sentryId) {
      addNonEnumerableProperty(target, "_sentryId", uuid4());
    }
    const name = event.type === "keypress" ? "input" : event.type;
    if (!isSimilarToLastCapturedEvent(event)) {
      const handlerData = { event, name, global: globalListener };
      handler(handlerData);
      lastCapturedEventType = event.type;
      lastCapturedEventTargetId = target ? target._sentryId : void 0;
    }
    clearTimeout(debounceTimerID);
    debounceTimerID = WINDOW$3.setTimeout(() => {
      lastCapturedEventTargetId = void 0;
      lastCapturedEventType = void 0;
    }, DEBOUNCE_DURATION);
  };
}
function getEventTarget$1(event) {
  try {
    return event.target;
  } catch {
    return null;
  }
}
let lastHref;
function addHistoryInstrumentationHandler(handler) {
  const type = "history";
  addHandler$1(type, handler);
  maybeInstrument(type, instrumentHistory);
}
function instrumentHistory() {
  WINDOW$3.addEventListener("popstate", () => {
    const to = WINDOW$3.location.href;
    const from = lastHref;
    lastHref = to;
    if (from === to) {
      return;
    }
    const handlerData = { from, to };
    triggerHandlers$1("history", handlerData);
  });
  if (!supportsHistory()) {
    return;
  }
  function historyReplacementFunction(originalHistoryFunction) {
    return function(...args) {
      const url = args.length > 2 ? args[2] : void 0;
      if (url) {
        const from = lastHref;
        const to = getAbsoluteUrl(String(url));
        lastHref = to;
        if (from === to) {
          return originalHistoryFunction.apply(this, args);
        }
        const handlerData = { from, to };
        triggerHandlers$1("history", handlerData);
      }
      return originalHistoryFunction.apply(this, args);
    };
  }
  fill(WINDOW$3.history, "pushState", historyReplacementFunction);
  fill(WINDOW$3.history, "replaceState", historyReplacementFunction);
}
function getAbsoluteUrl(urlOrPath) {
  try {
    const url = new URL(urlOrPath, WINDOW$3.location.origin);
    return url.toString();
  } catch {
    return urlOrPath;
  }
}
const cachedImplementations$3 = {};
function getNativeImplementation(name) {
  const cached = cachedImplementations$3[name];
  if (cached) {
    return cached;
  }
  let impl = WINDOW$3[name];
  if (isNativeFunction(impl)) {
    return cachedImplementations$3[name] = impl.bind(WINDOW$3);
  }
  const document2 = WINDOW$3.document;
  if (document2 && typeof document2.createElement === "function") {
    try {
      const sandbox = document2.createElement("iframe");
      sandbox.hidden = true;
      document2.head.appendChild(sandbox);
      const contentWindow = sandbox.contentWindow;
      if (contentWindow?.[name]) {
        impl = contentWindow[name];
      }
      document2.head.removeChild(sandbox);
    } catch (e2) {
      DEBUG_BUILD$3 && debug$2.warn(`Could not create sandbox iframe for ${name} check, bailing to window.${name}: `, e2);
    }
  }
  if (!impl) {
    return impl;
  }
  return cachedImplementations$3[name] = impl.bind(WINDOW$3);
}
function clearCachedImplementation(name) {
  cachedImplementations$3[name] = void 0;
}
function setTimeout$3(...rest) {
  return getNativeImplementation("setTimeout")(...rest);
}
const SENTRY_XHR_DATA_KEY = "__sentry_xhr_v3__";
function addXhrInstrumentationHandler(handler) {
  const type = "xhr";
  addHandler$1(type, handler);
  maybeInstrument(type, instrumentXHR);
}
function instrumentXHR() {
  if (!WINDOW$3.XMLHttpRequest) {
    return;
  }
  const xhrproto = XMLHttpRequest.prototype;
  xhrproto.open = new Proxy(xhrproto.open, {
    apply(originalOpen, xhrOpenThisArg, xhrOpenArgArray) {
      const virtualError = new Error();
      const startTimestamp = timestampInSeconds() * 1e3;
      const method = isString(xhrOpenArgArray[0]) ? xhrOpenArgArray[0].toUpperCase() : void 0;
      const url = parseXhrUrlArg(xhrOpenArgArray[1]);
      if (!method || !url) {
        return originalOpen.apply(xhrOpenThisArg, xhrOpenArgArray);
      }
      xhrOpenThisArg[SENTRY_XHR_DATA_KEY] = {
        method,
        url,
        request_headers: {}
      };
      if (method === "POST" && url.match(/sentry_key/)) {
        xhrOpenThisArg.__sentry_own_request__ = true;
      }
      const onreadystatechangeHandler = () => {
        const xhrInfo = xhrOpenThisArg[SENTRY_XHR_DATA_KEY];
        if (!xhrInfo) {
          return;
        }
        if (xhrOpenThisArg.readyState === 4) {
          try {
            xhrInfo.status_code = xhrOpenThisArg.status;
          } catch {
          }
          const handlerData = {
            endTimestamp: timestampInSeconds() * 1e3,
            startTimestamp,
            xhr: xhrOpenThisArg,
            virtualError
          };
          triggerHandlers$1("xhr", handlerData);
        }
      };
      if ("onreadystatechange" in xhrOpenThisArg && typeof xhrOpenThisArg.onreadystatechange === "function") {
        xhrOpenThisArg.onreadystatechange = new Proxy(xhrOpenThisArg.onreadystatechange, {
          apply(originalOnreadystatechange, onreadystatechangeThisArg, onreadystatechangeArgArray) {
            onreadystatechangeHandler();
            return originalOnreadystatechange.apply(onreadystatechangeThisArg, onreadystatechangeArgArray);
          }
        });
      } else {
        xhrOpenThisArg.addEventListener("readystatechange", onreadystatechangeHandler);
      }
      xhrOpenThisArg.setRequestHeader = new Proxy(xhrOpenThisArg.setRequestHeader, {
        apply(originalSetRequestHeader, setRequestHeaderThisArg, setRequestHeaderArgArray) {
          const [header, value] = setRequestHeaderArgArray;
          const xhrInfo = setRequestHeaderThisArg[SENTRY_XHR_DATA_KEY];
          if (xhrInfo && isString(header) && isString(value)) {
            xhrInfo.request_headers[header.toLowerCase()] = value;
          }
          return originalSetRequestHeader.apply(setRequestHeaderThisArg, setRequestHeaderArgArray);
        }
      });
      return originalOpen.apply(xhrOpenThisArg, xhrOpenArgArray);
    }
  });
  xhrproto.send = new Proxy(xhrproto.send, {
    apply(originalSend, sendThisArg, sendArgArray) {
      const sentryXhrData = sendThisArg[SENTRY_XHR_DATA_KEY];
      if (!sentryXhrData) {
        return originalSend.apply(sendThisArg, sendArgArray);
      }
      if (sendArgArray[0] !== void 0) {
        sentryXhrData.body = sendArgArray[0];
      }
      const handlerData = {
        startTimestamp: timestampInSeconds() * 1e3,
        xhr: sendThisArg
      };
      triggerHandlers$1("xhr", handlerData);
      return originalSend.apply(sendThisArg, sendArgArray);
    }
  });
}
function parseXhrUrlArg(url) {
  if (isString(url)) {
    return url;
  }
  try {
    return url.toString();
  } catch {
  }
  return void 0;
}
const ORIGINAL_REQ_BODY = /* @__PURE__ */ Symbol.for("sentry__originalRequestBody");
function serializeFormData(formData) {
  return new URLSearchParams(formData).toString();
}
function getBodyString(body, _debug = debug$2) {
  try {
    if (typeof body === "string") {
      return [body];
    }
    if (body instanceof URLSearchParams) {
      return [body.toString()];
    }
    if (body instanceof FormData) {
      return [serializeFormData(body)];
    }
    if (!body) {
      return [void 0];
    }
  } catch (error2) {
    DEBUG_BUILD$3 && _debug.error(error2, "Failed to serialize body", body);
    return [void 0, "BODY_PARSE_ERROR"];
  }
  DEBUG_BUILD$3 && _debug.log("Skipping network body because of body type", body);
  return [void 0, "UNPARSEABLE_BODY_TYPE"];
}
function getFetchRequestArgBody(fetchArgs = []) {
  if (fetchArgs.length >= 2 && fetchArgs[1] && typeof fetchArgs[1] === "object" && "body" in fetchArgs[1]) {
    return fetchArgs[1].body;
  }
  if (fetchArgs.length >= 1 && fetchArgs[0] instanceof Request) {
    const request = fetchArgs[0];
    const originalBody = request[ORIGINAL_REQ_BODY];
    if (originalBody !== void 0) {
      return originalBody;
    }
    return void 0;
  }
  return void 0;
}
function parseXhrResponseHeaders(xhr) {
  let headers;
  try {
    headers = xhr.getAllResponseHeaders();
  } catch (error2) {
    DEBUG_BUILD$3 && debug$2.error(error2, "Failed to get xhr response headers", xhr);
    return {};
  }
  if (!headers) {
    return {};
  }
  return headers.split("\r\n").reduce((acc, line) => {
    const [key, value] = line.split(": ");
    if (value) {
      acc[key.toLowerCase()] = value;
    }
    return acc;
  }, {});
}
function isElement$2(wat) {
  if (typeof Element === "undefined") {
    return false;
  }
  try {
    return wat instanceof Element;
  } catch {
    return false;
  }
}
const DEFAULT_BROWSER_TRANSPORT_BUFFER_SIZE = 40;
function makeFetchTransport(options, nativeFetch = getNativeImplementation("fetch")) {
  let pendingBodySize = 0;
  let pendingCount = 0;
  async function makeRequest(request) {
    const requestSize = request.body.length;
    pendingBodySize += requestSize;
    pendingCount++;
    const requestOptions = {
      body: request.body,
      method: "POST",
      referrerPolicy: "strict-origin",
      headers: options.headers,
      // Outgoing requests are usually cancelled when navigating to a different page, causing a "TypeError: Failed to
      // fetch" error and sending a "network_error" client-outcome - in Chrome, the request status shows "(cancelled)".
      // The `keepalive` flag keeps outgoing requests alive, even when switching pages. We want this since we're
      // frequently sending events right before the user is switching pages (eg. when finishing navigation transactions).
      // Gotchas:
      // - `keepalive` isn't supported by Firefox
      // - As per spec (https://fetch.spec.whatwg.org/#http-network-or-cache-fetch):
      //   If the sum of contentLength and inflightKeepaliveBytes is greater than 64 kibibytes, then return a network error.
      //   We will therefore only activate the flag when we're below that limit.
      // There is also a limit of requests that can be open at the same time, so we also limit this to 15
      // See https://github.com/getsentry/sentry-javascript/pull/7553 for details
      keepalive: pendingBodySize <= 6e4 && pendingCount < 15,
      ...options.fetchOptions
    };
    try {
      const response = await nativeFetch(options.url, requestOptions);
      return {
        statusCode: response.status,
        headers: {
          "x-sentry-rate-limits": response.headers.get("X-Sentry-Rate-Limits"),
          "retry-after": response.headers.get("Retry-After")
        }
      };
    } catch (e2) {
      clearCachedImplementation("fetch");
      throw e2;
    } finally {
      pendingBodySize -= requestSize;
      pendingCount--;
    }
  }
  return createTransport(
    options,
    makeRequest,
    makePromiseBuffer(options.bufferSize || DEFAULT_BROWSER_TRANSPORT_BUFFER_SIZE)
  );
}
const DEBUG_BUILD$2 = typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__;
function startProfiler() {
  const client = getClient();
  if (!client) {
    DEBUG_BUILD$2 && debug$2.warn("No Sentry client available, profiling is not started");
    return;
  }
  const integration = client.getIntegrationByName("BrowserProfiling");
  if (!integration) {
    DEBUG_BUILD$2 && debug$2.warn("BrowserProfiling integration is not available");
    return;
  }
  client.emit("startUIProfiler");
}
function stopProfiler() {
  const client = getClient();
  if (!client) {
    DEBUG_BUILD$2 && debug$2.warn("No Sentry client available, profiling is not started");
    return;
  }
  const integration = client.getIntegrationByName("BrowserProfiling");
  if (!integration) {
    DEBUG_BUILD$2 && debug$2.warn("ProfilingIntegration is not available");
    return;
  }
  client.emit("stopUIProfiler");
}
const uiProfiler = {
  startProfiler,
  stopProfiler
};
const OPERA10_PRIORITY = 10;
const OPERA11_PRIORITY = 20;
const CHROME_PRIORITY = 30;
const WINJS_PRIORITY = 40;
const GECKO_PRIORITY = 50;
function createFrame(filename, func, lineno, colno) {
  const frame = {
    filename,
    function: func === "<anonymous>" ? UNKNOWN_FUNCTION : func,
    in_app: true
    // All browser frames are considered in_app
  };
  if (lineno !== void 0) {
    frame.lineno = lineno;
  }
  if (colno !== void 0) {
    frame.colno = colno;
  }
  return frame;
}
const chromeRegexNoFnName = /^\s*at (\S+?)(?::(\d+))(?::(\d+))\s*$/i;
const chromeRegex = /^\s*at (?:(.+?\)(?: \[.+\])?|.*?) ?\((?:address at )?)?(?:async )?((?:<anonymous>|[-a-z]+:|.*bundle|\/)?.*?)(?::(\d+))?(?::(\d+))?\)?\s*$/i;
const chromeEvalRegex = /\((\S*)(?::(\d+))(?::(\d+))\)/;
const chromeDataUriRegex = /at (.+?) ?\(data:(.+?),/;
const chromeStackParserFn = (line) => {
  const dataUriMatch = line.match(chromeDataUriRegex);
  if (dataUriMatch) {
    return {
      filename: `<data:${dataUriMatch[2]}>`,
      function: dataUriMatch[1]
    };
  }
  const noFnParts = chromeRegexNoFnName.exec(line);
  if (noFnParts) {
    const [, filename, line2, col] = noFnParts;
    return createFrame(filename, UNKNOWN_FUNCTION, +line2, +col);
  }
  const parts = chromeRegex.exec(line);
  if (parts) {
    const isEval = parts[2]?.indexOf("eval") === 0;
    if (isEval) {
      const subMatch = chromeEvalRegex.exec(parts[2]);
      if (subMatch) {
        parts[2] = subMatch[1];
        parts[3] = subMatch[2];
        parts[4] = subMatch[3];
      }
    }
    const [func, filename] = extractSafariExtensionDetails(parts[1] || UNKNOWN_FUNCTION, parts[2]);
    return createFrame(filename, func, parts[3] ? +parts[3] : void 0, parts[4] ? +parts[4] : void 0);
  }
  return;
};
const chromeStackLineParser = [CHROME_PRIORITY, chromeStackParserFn];
const geckoREgex = /^\s*(.*?)(?:\((.*?)\))?(?:^|@)?((?:[-a-z]+)?:\/.*?|\[native code\]|[^@]*(?:bundle|\d+\.js)|\/[\w\-. /=]+)(?::(\d+))?(?::(\d+))?\s*$/i;
const geckoEvalRegex = /(\S+) line (\d+)(?: > eval line \d+)* > eval/i;
const gecko = (line) => {
  const parts = geckoREgex.exec(line);
  if (parts) {
    const isEval = parts[3] && parts[3].indexOf(" > eval") > -1;
    if (isEval) {
      const subMatch = geckoEvalRegex.exec(parts[3]);
      if (subMatch) {
        parts[1] = parts[1] || "eval";
        parts[3] = subMatch[1];
        parts[4] = subMatch[2];
        parts[5] = "";
      }
    }
    let filename = parts[3];
    let func = parts[1] || UNKNOWN_FUNCTION;
    [func, filename] = extractSafariExtensionDetails(func, filename);
    return createFrame(filename, func, parts[4] ? +parts[4] : void 0, parts[5] ? +parts[5] : void 0);
  }
  return;
};
const geckoStackLineParser = [GECKO_PRIORITY, gecko];
const winjsRegex = /^\s*at (?:((?:\[object object\])?.+) )?\(?((?:[-a-z]+):.*?):(\d+)(?::(\d+))?\)?\s*$/i;
const winjs = (line) => {
  const parts = winjsRegex.exec(line);
  return parts ? createFrame(parts[2], parts[1] || UNKNOWN_FUNCTION, +parts[3], parts[4] ? +parts[4] : void 0) : void 0;
};
const winjsStackLineParser = [WINJS_PRIORITY, winjs];
const opera10Regex = / line (\d+).*script (?:in )?(\S+)(?:: in function (\S+))?$/i;
const opera10 = (line) => {
  const parts = opera10Regex.exec(line);
  return parts ? createFrame(parts[2], parts[3] || UNKNOWN_FUNCTION, +parts[1]) : void 0;
};
const opera10StackLineParser = [OPERA10_PRIORITY, opera10];
const opera11Regex = / line (\d+), column (\d+)\s*(?:in (?:<anonymous function: ([^>]+)>|([^)]+))\(.*\))? in (.*):\s*$/i;
const opera11 = (line) => {
  const parts = opera11Regex.exec(line);
  return parts ? createFrame(parts[5], parts[3] || parts[4] || UNKNOWN_FUNCTION, +parts[1], +parts[2]) : void 0;
};
const opera11StackLineParser = [OPERA11_PRIORITY, opera11];
const defaultStackLineParsers = [chromeStackLineParser, geckoStackLineParser];
const defaultStackParser = createStackParser(...defaultStackLineParsers);
const extractSafariExtensionDetails = (func, filename) => {
  const isSafariExtension = func.indexOf("safari-extension") !== -1;
  const isSafariWebExtension = func.indexOf("safari-web-extension") !== -1;
  return isSafariExtension || isSafariWebExtension ? [
    func.indexOf("@") !== -1 ? func.split("@")[0] : UNKNOWN_FUNCTION,
    isSafariExtension ? `safari-extension:${filename}` : `safari-web-extension:${filename}`
  ] : [func, filename];
};
function createUserFeedbackEnvelope(feedback, {
  metadata,
  tunnel,
  dsn
}) {
  const headers = {
    event_id: feedback.event_id,
    sent_at: (/* @__PURE__ */ new Date()).toISOString(),
    ...metadata?.sdk && {
      sdk: {
        name: metadata.sdk.name,
        version: metadata.sdk.version
      }
    },
    ...!!tunnel && !!dsn && { dsn: dsnToString(dsn) }
  };
  const item = createUserFeedbackEnvelopeItem(feedback);
  return createEnvelope(headers, [item]);
}
function createUserFeedbackEnvelopeItem(feedback) {
  const feedbackHeaders = {
    type: "user_report"
  };
  return [feedbackHeaders, feedback];
}
const MAX_ALLOWED_STRING_LENGTH = 1024;
const INTEGRATION_NAME$c = "Breadcrumbs";
const _breadcrumbsIntegration = ((options = {}) => {
  const _options = {
    console: true,
    dom: true,
    fetch: true,
    history: true,
    sentry: true,
    xhr: true,
    ...options
  };
  return {
    name: INTEGRATION_NAME$c,
    setup(client) {
      if (_options.console) {
        addConsoleInstrumentationHandler(_getConsoleBreadcrumbHandler(client));
      }
      if (_options.dom) {
        addClickKeypressInstrumentationHandler(_getDomBreadcrumbHandler(client, _options.dom));
      }
      if (_options.xhr) {
        addXhrInstrumentationHandler(_getXhrBreadcrumbHandler(client));
      }
      if (_options.fetch) {
        addFetchInstrumentationHandler(_getFetchBreadcrumbHandler(client));
      }
      if (_options.history) {
        addHistoryInstrumentationHandler(_getHistoryBreadcrumbHandler(client));
      }
      if (_options.sentry) {
        client.on("beforeSendEvent", _getSentryBreadcrumbHandler(client));
      }
    }
  };
});
const breadcrumbsIntegration = defineIntegration(_breadcrumbsIntegration);
function _getSentryBreadcrumbHandler(client) {
  return function addSentryBreadcrumb(event) {
    if (getClient() !== client) {
      return;
    }
    addBreadcrumb(
      {
        category: `sentry.${event.type === "transaction" ? "transaction" : "event"}`,
        event_id: event.event_id,
        level: event.level,
        message: getEventDescription(event)
      },
      {
        event
      }
    );
  };
}
function _getDomBreadcrumbHandler(client, dom) {
  return function _innerDomBreadcrumb(handlerData) {
    if (getClient() !== client) {
      return;
    }
    let target;
    let componentName;
    let keyAttrs = typeof dom === "object" ? dom.serializeAttribute : void 0;
    let maxStringLength = typeof dom === "object" && typeof dom.maxStringLength === "number" ? dom.maxStringLength : void 0;
    if (maxStringLength && maxStringLength > MAX_ALLOWED_STRING_LENGTH) {
      DEBUG_BUILD$2 && debug$2.warn(
        `\`dom.maxStringLength\` cannot exceed ${MAX_ALLOWED_STRING_LENGTH}, but a value of ${maxStringLength} was configured. Sentry will use ${MAX_ALLOWED_STRING_LENGTH} instead.`
      );
      maxStringLength = MAX_ALLOWED_STRING_LENGTH;
    }
    if (typeof keyAttrs === "string") {
      keyAttrs = [keyAttrs];
    }
    try {
      const event = handlerData.event;
      const element = _isEvent(event) ? event.target : event;
      target = htmlTreeAsString(element, { keyAttrs, maxStringLength });
      componentName = getComponentName(element);
    } catch {
      target = "<unknown>";
    }
    if (target.length === 0) {
      return;
    }
    const breadcrumb = {
      category: `ui.${handlerData.name}`,
      message: target
    };
    if (componentName) {
      breadcrumb.data = { "ui.component_name": componentName };
    }
    addBreadcrumb(breadcrumb, {
      event: handlerData.event,
      name: handlerData.name,
      global: handlerData.global
    });
  };
}
function _getConsoleBreadcrumbHandler(client) {
  return function _consoleBreadcrumb(handlerData) {
    if (getClient() !== client) {
      return;
    }
    const breadcrumb = {
      category: "console",
      data: {
        arguments: handlerData.args,
        logger: "console"
      },
      level: severityLevelFromString(handlerData.level),
      message: safeJoin(handlerData.args, " ")
    };
    if (handlerData.level === "assert") {
      if (handlerData.args[0] === false) {
        breadcrumb.message = `Assertion failed: ${safeJoin(handlerData.args.slice(1), " ") || "console.assert"}`;
        breadcrumb.data.arguments = handlerData.args.slice(1);
      } else {
        return;
      }
    }
    addBreadcrumb(breadcrumb, {
      input: handlerData.args,
      level: handlerData.level
    });
  };
}
function _getXhrBreadcrumbHandler(client) {
  return function _xhrBreadcrumb(handlerData) {
    if (getClient() !== client) {
      return;
    }
    const { startTimestamp, endTimestamp } = handlerData;
    const sentryXhrData = handlerData.xhr[SENTRY_XHR_DATA_KEY];
    if (!startTimestamp || !endTimestamp || !sentryXhrData) {
      return;
    }
    const { method, url, status_code, body } = sentryXhrData;
    const data = {
      method,
      url,
      status_code
    };
    const hint = {
      xhr: handlerData.xhr,
      input: body,
      startTimestamp,
      endTimestamp
    };
    const breadcrumb = {
      category: "xhr",
      data,
      type: "http",
      level: getBreadcrumbLogLevelFromHttpStatusCode(status_code)
    };
    client.emit("beforeOutgoingRequestBreadcrumb", breadcrumb, hint);
    addBreadcrumb(breadcrumb, hint);
  };
}
function _getFetchBreadcrumbHandler(client) {
  return function _fetchBreadcrumb(handlerData) {
    if (getClient() !== client) {
      return;
    }
    const { startTimestamp, endTimestamp } = handlerData;
    if (!endTimestamp) {
      return;
    }
    if (handlerData.fetchData.url.match(/sentry_key/) && handlerData.fetchData.method === "POST") {
      return;
    }
    if (handlerData.error) {
      const hint = {
        data: handlerData.error,
        input: handlerData.args,
        startTimestamp,
        endTimestamp
      };
      const breadcrumb = {
        category: "fetch",
        data: handlerData.fetchData,
        level: "error",
        type: "http"
      };
      client.emit("beforeOutgoingRequestBreadcrumb", breadcrumb, hint);
      addBreadcrumb(breadcrumb, hint);
    } else {
      const response = handlerData.response;
      const data = {
        ...handlerData.fetchData,
        status_code: response?.status
      };
      const hint = {
        input: handlerData.args,
        response,
        startTimestamp,
        endTimestamp
      };
      const breadcrumb = {
        category: "fetch",
        data,
        type: "http",
        level: getBreadcrumbLogLevelFromHttpStatusCode(data.status_code)
      };
      client.emit("beforeOutgoingRequestBreadcrumb", breadcrumb, hint);
      addBreadcrumb(breadcrumb, hint);
    }
  };
}
function _getHistoryBreadcrumbHandler(client) {
  return function _historyBreadcrumb(handlerData) {
    if (getClient() !== client) {
      return;
    }
    let from = handlerData.from;
    let to = handlerData.to;
    const parsedLoc = parseUrl(WINDOW$4.location.href);
    let parsedFrom = from ? parseUrl(from) : void 0;
    const parsedTo = parseUrl(to);
    if (!parsedFrom?.path) {
      parsedFrom = parsedLoc;
    }
    if (parsedLoc.protocol === parsedTo.protocol && parsedLoc.host === parsedTo.host) {
      to = parsedTo.relative;
    }
    if (parsedLoc.protocol === parsedFrom.protocol && parsedLoc.host === parsedFrom.host) {
      from = parsedFrom.relative;
    }
    addBreadcrumb({
      category: "navigation",
      data: {
        from,
        to
      }
    });
  };
}
function _isEvent(event) {
  return !!event && !!event.target;
}
const DEFAULT_EVENT_TARGET = "EventTarget,Window,Node,ApplicationCache,AudioTrackList,BroadcastChannel,ChannelMergerNode,CryptoOperation,EventSource,FileReader,HTMLUnknownElement,IDBDatabase,IDBRequest,IDBTransaction,KeyOperation,MediaController,MessagePort,ModalWindow,Notification,SVGElementInstance,Screen,SharedWorker,TextTrack,TextTrackCue,TextTrackList,WebSocket,WebSocketWorker,Worker,XMLHttpRequest,XMLHttpRequestEventTarget,XMLHttpRequestUpload".split(
  ","
);
const INTEGRATION_NAME$b = "BrowserApiErrors";
const _browserApiErrorsIntegration = ((options = {}) => {
  const _options = {
    XMLHttpRequest: true,
    eventTarget: true,
    requestAnimationFrame: true,
    setInterval: true,
    setTimeout: true,
    unregisterOriginalCallbacks: false,
    ...options
  };
  return {
    name: INTEGRATION_NAME$b,
    // TODO: This currently only works for the first client this is setup
    // We may want to adjust this to check for client etc.
    setupOnce() {
      if (_options.setTimeout) {
        fill(WINDOW$4, "setTimeout", _wrapTimeFunction);
      }
      if (_options.setInterval) {
        fill(WINDOW$4, "setInterval", _wrapTimeFunction);
      }
      if (_options.requestAnimationFrame) {
        fill(WINDOW$4, "requestAnimationFrame", _wrapRAF);
      }
      if (_options.XMLHttpRequest && "XMLHttpRequest" in WINDOW$4) {
        fill(XMLHttpRequest.prototype, "send", _wrapXHR$1);
      }
      const eventTargetOption = _options.eventTarget;
      if (eventTargetOption) {
        const eventTarget = Array.isArray(eventTargetOption) ? eventTargetOption : DEFAULT_EVENT_TARGET;
        eventTarget.forEach((target) => _wrapEventTarget(target, _options));
      }
    }
  };
});
const browserApiErrorsIntegration = defineIntegration(_browserApiErrorsIntegration);
function _wrapTimeFunction(original) {
  return function(...args) {
    const originalCallback = args[0];
    args[0] = wrap(originalCallback, {
      mechanism: {
        handled: false,
        type: `auto.browser.browserapierrors.${getFunctionName(original)}`
      }
    });
    return original.apply(this, args);
  };
}
function _wrapRAF(original) {
  return function(callback) {
    return original.apply(this, [
      wrap(callback, {
        mechanism: {
          data: {
            handler: getFunctionName(original)
          },
          handled: false,
          type: "auto.browser.browserapierrors.requestAnimationFrame"
        }
      })
    ]);
  };
}
function _wrapXHR$1(originalSend) {
  return function(...args) {
    const xhr = this;
    const xmlHttpRequestProps = ["onload", "onerror", "onprogress", "onreadystatechange"];
    xmlHttpRequestProps.forEach((prop) => {
      if (prop in xhr && typeof xhr[prop] === "function") {
        fill(xhr, prop, function(original) {
          const wrapOptions = {
            mechanism: {
              data: {
                handler: getFunctionName(original)
              },
              handled: false,
              type: `auto.browser.browserapierrors.xhr.${prop}`
            }
          };
          const originalFunction = getOriginalFunction(original);
          if (originalFunction) {
            wrapOptions.mechanism.data.handler = getFunctionName(originalFunction);
          }
          return wrap(original, wrapOptions);
        });
      }
    });
    return originalSend.apply(this, args);
  };
}
function _wrapEventTarget(target, integrationOptions) {
  const globalObject = WINDOW$4;
  const proto = globalObject[target]?.prototype;
  if (!proto?.hasOwnProperty?.("addEventListener")) {
    return;
  }
  fill(proto, "addEventListener", function(original) {
    return function(eventName, fn, options) {
      try {
        if (isEventListenerObject(fn)) {
          fn.handleEvent = wrap(fn.handleEvent, {
            mechanism: {
              data: {
                handler: getFunctionName(fn),
                target
              },
              handled: false,
              type: "auto.browser.browserapierrors.handleEvent"
            }
          });
        }
      } catch {
      }
      if (integrationOptions.unregisterOriginalCallbacks) {
        unregisterOriginalCallback(this, eventName, fn);
      }
      return original.apply(this, [
        eventName,
        wrap(fn, {
          mechanism: {
            data: {
              handler: getFunctionName(fn),
              target
            },
            handled: false,
            type: "auto.browser.browserapierrors.addEventListener"
          }
        }),
        options
      ]);
    };
  });
  fill(proto, "removeEventListener", function(originalRemoveEventListener) {
    return function(eventName, fn, options) {
      try {
        const originalEventHandler = fn.__sentry_wrapped__;
        if (originalEventHandler) {
          originalRemoveEventListener.call(this, eventName, originalEventHandler, options);
        }
      } catch {
      }
      return originalRemoveEventListener.call(this, eventName, fn, options);
    };
  });
}
function isEventListenerObject(obj) {
  return typeof obj.handleEvent === "function";
}
function unregisterOriginalCallback(target, eventName, fn) {
  if (target && typeof target === "object" && "removeEventListener" in target && typeof target.removeEventListener === "function") {
    target.removeEventListener(eventName, fn);
  }
}
const browserSessionIntegration = defineIntegration((options = {}) => {
  const lifecycle = options.lifecycle ?? "route";
  return {
    name: "BrowserSession",
    setupOnce() {
      if (typeof WINDOW$4.document === "undefined") {
        DEBUG_BUILD$2 && debug$2.warn("Using the `browserSessionIntegration` in non-browser environments is not supported.");
        return;
      }
      startSession({ ignoreDuration: true });
      captureSession();
      const isolationScope = getIsolationScope();
      let previousUser = isolationScope.getUser();
      isolationScope.addScopeListener((scope) => {
        const maybeNewUser = scope.getUser();
        if (previousUser?.id !== maybeNewUser?.id || previousUser?.ip_address !== maybeNewUser?.ip_address) {
          captureSession();
          previousUser = maybeNewUser;
        }
      });
      if (lifecycle === "route") {
        addHistoryInstrumentationHandler(({ from, to }) => {
          if (from !== to) {
            startSession({ ignoreDuration: true });
            captureSession();
          }
        });
      }
    }
  };
});
const INTEGRATION_NAME$a = "CultureContext";
const _cultureContextIntegration = (() => {
  return {
    name: INTEGRATION_NAME$a,
    preprocessEvent(event) {
      const culture = getCultureContext();
      if (culture) {
        event.contexts = {
          ...event.contexts,
          culture: { ...culture, ...event.contexts?.culture }
        };
      }
    },
    processSegmentSpan(span) {
      const culture = getCultureContext();
      if (culture) {
        safeSetSpanJSONAttributes(span, {
          "culture.locale": culture.locale,
          "culture.timezone": culture.timezone,
          "culture.calendar": culture.calendar
        });
      }
    }
  };
});
const cultureContextIntegration = defineIntegration(_cultureContextIntegration);
function getCultureContext() {
  try {
    const intl = WINDOW$4.Intl;
    if (!intl) {
      return void 0;
    }
    const options = intl.DateTimeFormat().resolvedOptions();
    return {
      locale: options.locale,
      timezone: options.timeZone,
      calendar: options.calendar
    };
  } catch {
    return void 0;
  }
}
const INTEGRATION_NAME$9 = "GlobalHandlers";
const _globalHandlersIntegration = ((options = {}) => {
  const _options = {
    onerror: true,
    onunhandledrejection: true,
    ...options
  };
  return {
    name: INTEGRATION_NAME$9,
    setupOnce() {
      Error.stackTraceLimit = 50;
    },
    setup(client) {
      if (_options.onerror) {
        _installGlobalOnErrorHandler(client);
        globalHandlerLog("onerror");
      }
      if (_options.onunhandledrejection) {
        _installGlobalOnUnhandledRejectionHandler(client);
        globalHandlerLog("onunhandledrejection");
      }
    }
  };
});
const globalHandlersIntegration = defineIntegration(_globalHandlersIntegration);
function _installGlobalOnErrorHandler(client) {
  addGlobalErrorInstrumentationHandler((data) => {
    const { stackParser, attachStacktrace } = getOptions();
    if (getClient() !== client || shouldIgnoreOnError()) {
      return;
    }
    const { msg, url, line, column, error: error2 } = data;
    const event = _enhanceEventWithInitialFrame(
      eventFromUnknownInput(stackParser, error2 || msg, void 0, attachStacktrace, false),
      url,
      line,
      column
    );
    event.level = "error";
    captureEvent(event, {
      originalException: error2,
      mechanism: {
        handled: false,
        type: "auto.browser.global_handlers.onerror"
      }
    });
  });
}
function _installGlobalOnUnhandledRejectionHandler(client) {
  addGlobalUnhandledRejectionInstrumentationHandler((e2) => {
    const { stackParser, attachStacktrace } = getOptions();
    if (getClient() !== client || shouldIgnoreOnError()) {
      return;
    }
    const error2 = _getUnhandledRejectionError(e2);
    const event = isPrimitive(error2) ? _eventFromRejectionWithPrimitive(error2) : eventFromUnknownInput(stackParser, error2, void 0, attachStacktrace, true);
    event.level = "error";
    captureEvent(event, {
      originalException: error2,
      mechanism: {
        handled: false,
        type: "auto.browser.global_handlers.onunhandledrejection"
      }
    });
  });
}
function _getUnhandledRejectionError(error2) {
  if (isPrimitive(error2)) {
    return error2;
  }
  try {
    if ("reason" in error2) {
      return error2.reason;
    }
    if ("detail" in error2 && "reason" in error2.detail) {
      return error2.detail.reason;
    }
  } catch {
  }
  return error2;
}
function _eventFromRejectionWithPrimitive(reason) {
  return {
    exception: {
      values: [
        {
          type: "UnhandledRejection",
          // String() is needed because the Primitive type includes symbols (which can't be automatically stringified)
          value: `Non-Error promise rejection captured with value: ${String(reason)}`
        }
      ]
    }
  };
}
function _enhanceEventWithInitialFrame(event, url, lineno, colno) {
  const e2 = event.exception = event.exception || {};
  const ev = e2.values = e2.values || [];
  const ev0 = ev[0] = ev[0] || {};
  const ev0s = ev0.stacktrace = ev0.stacktrace || {};
  const ev0sf = ev0s.frames = ev0s.frames || [];
  if (ev0sf.length === 0) {
    ev0sf.push({
      colno,
      lineno,
      filename: getFilenameFromUrl(url) ?? getLocationHref(),
      function: UNKNOWN_FUNCTION,
      in_app: true
    });
  }
  return event;
}
function globalHandlerLog(type) {
  DEBUG_BUILD$2 && debug$2.log(`Global Handler attached: ${type}`);
}
function getOptions() {
  const client = getClient();
  const options = client?.getOptions() || {
    stackParser: () => [],
    attachStacktrace: false
  };
  return options;
}
function getFilenameFromUrl(url) {
  if (!isString(url) || url.length === 0) {
    return void 0;
  }
  if (url.startsWith("data:")) {
    return `<${stripDataUrlContent(url, false)}>`;
  }
  return url;
}
const httpContextIntegration = defineIntegration(() => {
  return {
    name: "HttpContext",
    preprocessEvent(event) {
      if (!WINDOW$4.navigator && !WINDOW$4.location && !WINDOW$4.document) {
        return;
      }
      const reqData = getHttpRequestData();
      const headers = {
        ...reqData.headers,
        ...event.request?.headers
      };
      event.request = {
        ...reqData,
        ...event.request,
        headers
      };
    },
    processSegmentSpan(span) {
      if (!WINDOW$4.navigator && !WINDOW$4.location && !WINDOW$4.document) {
        return;
      }
      const reqData = getHttpRequestData();
      safeSetSpanJSONAttributes(span, {
        // Coerce empty string to undefined so the helper's nullish check drops it,
        // rather than writing an empty `url.full` attribute onto the span.
        "url.full": reqData.url || void 0,
        "http.request.header.user_agent": reqData.headers["User-Agent"],
        "http.request.header.referer": reqData.headers["Referer"]
      });
    }
  };
});
const DEFAULT_KEY = "cause";
const DEFAULT_LIMIT = 5;
const INTEGRATION_NAME$8 = "LinkedErrors";
const _linkedErrorsIntegration = ((options = {}) => {
  const limit = options.limit || DEFAULT_LIMIT;
  const key = options.key || DEFAULT_KEY;
  return {
    name: INTEGRATION_NAME$8,
    preprocessEvent(event, hint, client) {
      const options2 = client.getOptions();
      applyAggregateErrorsToEvent(
        // This differs from the LinkedErrors integration in core by using a different exceptionFromError function
        exceptionFromError,
        options2.stackParser,
        key,
        limit,
        event,
        hint
      );
    }
  };
});
const linkedErrorsIntegration = defineIntegration(_linkedErrorsIntegration);
const HTML_ELEMENT_CONSTRUCTOR_NAME_REGEX = /^HTML(\w*)Element$/;
function normalizeStringifyValue$1(value) {
  if (typeof window !== "undefined" && value === window) {
    return "[Window]";
  }
  if (typeof document !== "undefined" && value === document) {
    return "[Document]";
  }
  if (isElement$2(value)) {
    const objName = getConstructorName(value);
    if (HTML_ELEMENT_CONSTRUCTOR_NAME_REGEX.test(objName)) {
      return `[HTMLElement: ${htmlTreeAsString(value)}]`;
    }
  }
  return void 0;
}
function getConstructorName(value) {
  const prototype = Object.getPrototypeOf(value);
  return prototype?.constructor ? prototype.constructor.name : "null prototype";
}
function checkAndWarnIfIsEmbeddedBrowserExtension() {
  if (_isEmbeddedBrowserExtension()) {
    if (DEBUG_BUILD$2) {
      consoleSandbox(() => {
        console.error(
          "[Sentry] You cannot use Sentry.init() in a browser extension, see: https://docs.sentry.io/platforms/javascript/best-practices/browser-extensions/"
        );
      });
    }
    return true;
  }
  return false;
}
function _isEmbeddedBrowserExtension() {
  if (typeof WINDOW$4.window === "undefined") {
    return false;
  }
  const _window = WINDOW$4;
  if (_window.nw) {
    return false;
  }
  const extensionObject = _window["chrome"] || _window["browser"];
  if (!extensionObject?.runtime?.id) {
    return false;
  }
  const href = getLocationHref();
  const isDedicatedExtensionPage = WINDOW$4 === WINDOW$4.top && /^(?:chrome-extension|moz-extension|ms-browser-extension|safari-web-extension):\/\//.test(href);
  return !isDedicatedExtensionPage;
}
function getDefaultIntegrations(_options) {
  return [
    // TODO(v11): Replace with `eventFiltersIntegration` once we remove the deprecated `inboundFiltersIntegration`
    // eslint-disable-next-line deprecation/deprecation
    inboundFiltersIntegration(),
    functionToStringIntegration(),
    conversationIdIntegration(),
    browserApiErrorsIntegration(),
    breadcrumbsIntegration(),
    globalHandlersIntegration(),
    linkedErrorsIntegration(),
    dedupeIntegration(),
    httpContextIntegration(),
    cultureContextIntegration(),
    browserSessionIntegration()
  ];
}
function init$1(options = {}) {
  const shouldDisableBecauseIsBrowserExtenstion = !options.skipBrowserExtensionCheck && checkAndWarnIfIsEmbeddedBrowserExtension();
  let defaultIntegrations = options.defaultIntegrations == null ? getDefaultIntegrations() : options.defaultIntegrations;
  const clientOptions = {
    ...options,
    enabled: shouldDisableBecauseIsBrowserExtenstion ? false : options.enabled,
    stackParser: stackParserFromStackParserOptions(options.stackParser || defaultStackParser),
    integrations: getIntegrationsToSetup({
      integrations: options.integrations,
      defaultIntegrations
    }),
    transport: options.transport || makeFetchTransport
  };
  setNormalizeStringifier(normalizeStringifyValue$1);
  return initAndBind(BrowserClient, clientOptions);
}
function forceLoad() {
}
function onLoad(callback) {
  callback();
}
function showReportDialog(options = {}) {
  const optionalDocument = WINDOW$4.document;
  const injectionPoint = optionalDocument?.head || optionalDocument?.body;
  if (!injectionPoint) {
    DEBUG_BUILD$2 && debug$2.error("[showReportDialog] Global document not defined");
    return;
  }
  const scope = getCurrentScope();
  const client = getClient();
  const dsn = client?.getDsn();
  if (!dsn) {
    DEBUG_BUILD$2 && debug$2.error("[showReportDialog] DSN not configured");
    return;
  }
  const mergedOptions = {
    ...options,
    user: {
      ...scope.getUser(),
      ...options.user
    },
    eventId: options.eventId || lastEventId()
  };
  const script = WINDOW$4.document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = getReportDialogEndpoint(dsn, mergedOptions);
  const { onLoad: onLoad2, onClose } = mergedOptions;
  if (onLoad2) {
    script.onload = onLoad2;
  }
  if (onClose) {
    const reportDialogClosedMessageHandler = (event) => {
      if (event.data === "__sentry_reportdialog_closed__") {
        try {
          onClose();
        } finally {
          WINDOW$4.removeEventListener("message", reportDialogClosedMessageHandler);
        }
      }
    };
    WINDOW$4.addEventListener("message", reportDialogClosedMessageHandler);
  }
  injectionPoint.appendChild(script);
}
const WINDOW$2 = GLOBAL_OBJ;
const INTEGRATION_NAME$7 = "ReportingObserver";
const SETUP_CLIENTS = /* @__PURE__ */ new WeakMap();
const _reportingObserverIntegration = ((options = {}) => {
  const types = options.types || ["crash", "deprecation", "intervention"];
  function handler(reports) {
    if (!SETUP_CLIENTS.has(getClient())) {
      return;
    }
    for (const report of reports) {
      withScope((scope) => {
        scope.setExtra("url", report.url);
        const label = `ReportingObserver [${report.type}]`;
        let details = "No details available";
        if (report.body) {
          const plainBody = {};
          for (const prop in report.body) {
            plainBody[prop] = report.body[prop];
          }
          scope.setExtra("body", plainBody);
          if (report.type === "crash") {
            const body = report.body;
            details = [body.crashId || "", body.reason || ""].join(" ").trim() || details;
          } else {
            const body = report.body;
            details = body.message || details;
          }
        }
        captureMessage(`${label}: ${details}`);
      });
    }
  }
  return {
    name: INTEGRATION_NAME$7,
    setupOnce() {
      if (!supportsReportingObserver()) {
        return;
      }
      const observer = new WINDOW$2.ReportingObserver(
        handler,
        {
          buffered: true,
          types
        }
      );
      observer.observe();
    },
    setup(client) {
      SETUP_CLIENTS.set(client, true);
    }
  };
});
const reportingObserverIntegration = defineIntegration(_reportingObserverIntegration);
const INTEGRATION_NAME$6 = "HttpClient";
const _httpClientIntegration = ((options = {}) => {
  const _options = {
    failedRequestStatusCodes: [[500, 599]],
    failedRequestTargets: [/.*/],
    ...options
  };
  return {
    name: INTEGRATION_NAME$6,
    setup(client) {
      _wrapFetch(client, _options);
      _wrapXHR(client, _options);
    }
  };
});
const httpClientIntegration = defineIntegration(_httpClientIntegration);
function _fetchResponseHandler(options, requestInfo, response, requestInit, error2) {
  if (_shouldCaptureResponse(options, response.status, response.url)) {
    const request = _getRequest(requestInfo, requestInit);
    let requestHeaders, responseHeaders, requestCookies, responseCookies;
    const dc = _getDataCollectionSettings();
    if (dc.requestHeaders !== false) {
      requestHeaders = filterKeyValueData(_extractFetchHeaders(request.headers), dc.requestHeaders);
    }
    if (dc.responseHeaders !== false) {
      responseHeaders = filterKeyValueData(_extractFetchHeaders(response.headers), dc.responseHeaders);
    }
    if (dc.cookies !== false) {
      const reqCookieStr = request.headers.get("Cookie") || void 0;
      if (reqCookieStr) {
        const filtered = filterCookies(reqCookieStr, dc.cookies);
        if (typeof filtered === "object") {
          requestCookies = filtered;
        }
      }
      const resCookieStr = response.headers.get("Set-Cookie") || void 0;
      if (resCookieStr) {
        const filtered = filterCookies(resCookieStr, dc.cookies);
        if (typeof filtered === "object") {
          responseCookies = filtered;
        }
      }
    }
    const event = _createEvent({
      url: request.url,
      method: request.method,
      status: response.status,
      requestHeaders,
      responseHeaders,
      requestCookies,
      responseCookies,
      error: error2,
      type: "fetch"
    });
    captureEvent(event);
  }
}
function _xhrResponseHandler(options, xhr, method, headers, error2) {
  if (_shouldCaptureResponse(options, xhr.status, xhr.responseURL)) {
    let requestHeaders, responseCookies, responseHeaders;
    const dc = _getDataCollectionSettings();
    if (dc.cookies !== false) {
      try {
        const cookieString = xhr.getResponseHeader("Set-Cookie") || xhr.getResponseHeader("set-cookie") || void 0;
        if (cookieString) {
          const filtered = filterCookies(cookieString, dc.cookies);
          if (typeof filtered === "object") {
            responseCookies = filtered;
          }
        }
      } catch {
      }
    }
    if (dc.responseHeaders !== false) {
      try {
        responseHeaders = filterKeyValueData(_getXHRResponseHeaders(xhr), dc.responseHeaders);
      } catch {
      }
    }
    if (dc.requestHeaders !== false) {
      requestHeaders = filterKeyValueData(headers, dc.requestHeaders);
    }
    const event = _createEvent({
      url: xhr.responseURL,
      method,
      status: xhr.status,
      requestHeaders,
      // Can't access request cookies from XHR
      responseHeaders,
      responseCookies,
      error: error2,
      type: "xhr"
    });
    captureEvent(event);
  }
}
function _getResponseSizeFromHeaders(headers) {
  if (headers) {
    const contentLength = headers["Content-Length"] || headers["content-length"];
    if (contentLength) {
      return parseInt(contentLength, 10);
    }
  }
  return void 0;
}
function _extractFetchHeaders(headers) {
  const result = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}
function _getXHRResponseHeaders(xhr) {
  const headers = xhr.getAllResponseHeaders();
  if (!headers) {
    return {};
  }
  return headers.split("\r\n").reduce((acc, line) => {
    const [key, value] = line.split(": ");
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {});
}
function _isInGivenRequestTargets(failedRequestTargets, target) {
  return failedRequestTargets.some((givenRequestTarget) => {
    if (typeof givenRequestTarget === "string") {
      return target.includes(givenRequestTarget);
    }
    return givenRequestTarget.test(target);
  });
}
function _isInGivenStatusRanges(failedRequestStatusCodes, status) {
  return failedRequestStatusCodes.some((range) => {
    if (typeof range === "number") {
      return range === status;
    }
    return status >= range[0] && status <= range[1];
  });
}
function _wrapFetch(client, options) {
  if (!supportsNativeFetch()) {
    return;
  }
  addFetchInstrumentationHandler((handlerData) => {
    if (getClient() !== client) {
      return;
    }
    const { response, args, error: error2, virtualError } = handlerData;
    const [requestInfo, requestInit] = args;
    if (!response) {
      return;
    }
    _fetchResponseHandler(options, requestInfo, response, requestInit, error2 || virtualError);
  }, false);
}
function _wrapXHR(client, options) {
  if (!("XMLHttpRequest" in GLOBAL_OBJ)) {
    return;
  }
  addXhrInstrumentationHandler((handlerData) => {
    if (getClient() !== client) {
      return;
    }
    const { error: error2, virtualError } = handlerData;
    const xhr = handlerData.xhr;
    const sentryXhrData = xhr[SENTRY_XHR_DATA_KEY];
    if (!sentryXhrData) {
      return;
    }
    const { method, request_headers: headers } = sentryXhrData;
    try {
      _xhrResponseHandler(options, xhr, method, headers, error2 || virtualError);
    } catch (e2) {
      DEBUG_BUILD$2 && debug$2.warn("Error while extracting response event form XHR response", e2);
    }
  });
}
function _shouldCaptureResponse(options, status, url) {
  return _isInGivenStatusRanges(options.failedRequestStatusCodes, status) && _isInGivenRequestTargets(options.failedRequestTargets, url) && !isSentryRequestUrl(url, getClient());
}
function _createEvent(data) {
  const client = getClient();
  const virtualStackTrace = client && data.error && data.error instanceof Error ? data.error.stack : void 0;
  const stack = virtualStackTrace && client ? client.getOptions().stackParser(virtualStackTrace, 0, 1) : void 0;
  const message = `HTTP Client Error with status code: ${data.status}`;
  const event = {
    message,
    exception: {
      values: [
        {
          type: "Error",
          value: message,
          stacktrace: stack ? { frames: stack } : void 0
        }
      ]
    },
    request: {
      url: data.url,
      method: data.method,
      headers: data.requestHeaders,
      cookies: data.requestCookies
    },
    contexts: {
      response: {
        status_code: data.status,
        headers: data.responseHeaders,
        cookies: data.responseCookies,
        body_size: _getResponseSizeFromHeaders(data.responseHeaders)
      }
    }
  };
  addExceptionMechanism(event, {
    type: `auto.http.client.${data.type}`,
    handled: false
  });
  return event;
}
function _getRequest(requestInfo, requestInit) {
  if (!requestInit && requestInfo instanceof Request) {
    return requestInfo;
  }
  if (requestInfo instanceof Request && requestInfo.bodyUsed) {
    return requestInfo;
  }
  return new Request(requestInfo, requestInit);
}
function _getDataCollectionSettings() {
  const client = getClient();
  if (!client) {
    return { cookies: false, requestHeaders: false, responseHeaders: false };
  }
  const options = client.getOptions();
  if (options.dataCollection == null) {
    const enabled = Boolean(options.sendDefaultPii);
    return { cookies: enabled, requestHeaders: enabled, responseHeaders: enabled };
  }
  const { cookies, httpHeaders } = client.getDataCollectionOptions();
  return { cookies, requestHeaders: httpHeaders.request, responseHeaders: httpHeaders.response };
}
const WINDOW$1 = GLOBAL_OBJ;
const DEFAULT_LINES_OF_CONTEXT = 7;
const INTEGRATION_NAME$5 = "ContextLines";
const _contextLinesIntegration = ((options = {}) => {
  const contextLines = options.frameContextLines != null ? options.frameContextLines : DEFAULT_LINES_OF_CONTEXT;
  return {
    name: INTEGRATION_NAME$5,
    processEvent(event) {
      return addSourceContext(event, contextLines);
    }
  };
});
const contextLinesIntegration = defineIntegration(_contextLinesIntegration);
function addSourceContext(event, contextLines) {
  const doc = WINDOW$1.document;
  const htmlFilename = WINDOW$1.location && stripUrlQueryAndFragment(WINDOW$1.location.href);
  if (!doc || !htmlFilename) {
    return event;
  }
  const exceptions = event.exception?.values;
  if (!exceptions?.length) {
    return event;
  }
  const html = doc.documentElement.innerHTML;
  if (!html) {
    return event;
  }
  const htmlLines = ["<!DOCTYPE html>", "<html>", ...html.split("\n"), "</html>"];
  exceptions.forEach((exception) => {
    const stacktrace = exception.stacktrace;
    if (stacktrace?.frames) {
      stacktrace.frames = stacktrace.frames.map(
        (frame) => applySourceContextToFrame(frame, htmlLines, htmlFilename, contextLines)
      );
    }
  });
  return event;
}
function applySourceContextToFrame(frame, htmlLines, htmlFilename, linesOfContext) {
  if (frame.filename !== htmlFilename || !frame.lineno || !htmlLines.length) {
    return frame;
  }
  addContextToFrame(htmlLines, frame, linesOfContext);
  return frame;
}
const INTEGRATION_NAME$4 = "GraphQLClient";
const _graphqlClientIntegration = ((options) => {
  return {
    name: INTEGRATION_NAME$4,
    setup(client) {
      _updateSpanWithGraphQLData(client, options);
      _updateBreadcrumbWithGraphQLData(client, options);
    }
  };
});
function _updateSpanWithGraphQLData(client, options) {
  client.on("beforeOutgoingRequestSpan", (span, hint) => {
    const spanJSON = spanToJSON(span);
    const spanAttributes = spanJSON.data || {};
    const spanOp = spanAttributes[SEMANTIC_ATTRIBUTE_SENTRY_OP];
    const isHttpClientSpan = spanOp === "http.client";
    if (!isHttpClientSpan) {
      return;
    }
    const httpUrl = spanAttributes[SEMANTIC_ATTRIBUTE_URL_FULL] || spanAttributes["http.url"] || spanAttributes["url"];
    const httpMethod = spanAttributes[SEMANTIC_ATTRIBUTE_HTTP_REQUEST_METHOD] || spanAttributes["http.method"];
    if (!isString(httpUrl) || !isString(httpMethod)) {
      return;
    }
    const { endpoints } = options;
    const isTracedGraphqlEndpoint = stringMatchesSomePattern(httpUrl, endpoints);
    const payload = getRequestPayloadXhrOrFetch(hint);
    if (isTracedGraphqlEndpoint && payload) {
      const graphqlBody = getGraphQLRequestPayload(payload);
      if (graphqlBody) {
        const operationInfo = _getGraphQLOperation(graphqlBody);
        span.updateName(`${httpMethod} ${httpUrl} (${operationInfo})`);
        if (isStandardRequest(graphqlBody)) {
          span.setAttribute("graphql.document", graphqlBody.query);
        }
        if (isPersistedRequest(graphqlBody)) {
          span.setAttribute("graphql.persisted_query.hash.sha256", graphqlBody.extensions.persistedQuery.sha256Hash);
          span.setAttribute("graphql.persisted_query.version", graphqlBody.extensions.persistedQuery.version);
        }
      }
    }
  });
}
function _updateBreadcrumbWithGraphQLData(client, options) {
  client.on("beforeOutgoingRequestBreadcrumb", (breadcrumb, handlerData) => {
    const { category, type, data } = breadcrumb;
    const isFetch = category === "fetch";
    const isXhr = category === "xhr";
    const isHttpBreadcrumb = type === "http";
    if (isHttpBreadcrumb && (isFetch || isXhr)) {
      const httpUrl = data?.url;
      const { endpoints } = options;
      const isTracedGraphqlEndpoint = stringMatchesSomePattern(httpUrl, endpoints);
      const payload = getRequestPayloadXhrOrFetch(handlerData);
      if (isTracedGraphqlEndpoint && data && payload) {
        const graphqlBody = getGraphQLRequestPayload(payload);
        if (!data.graphql && graphqlBody) {
          const operationInfo = _getGraphQLOperation(graphqlBody);
          data["graphql.operation"] = operationInfo;
          if (isStandardRequest(graphqlBody)) {
            data["graphql.document"] = graphqlBody.query;
          }
          if (isPersistedRequest(graphqlBody)) {
            data["graphql.persisted_query.hash.sha256"] = graphqlBody.extensions.persistedQuery.sha256Hash;
            data["graphql.persisted_query.version"] = graphqlBody.extensions.persistedQuery.version;
          }
        }
      }
    }
  });
}
function _getGraphQLOperation(requestBody) {
  if (isPersistedRequest(requestBody)) {
    return `persisted ${requestBody.operationName}`;
  }
  if (isStandardRequest(requestBody)) {
    const { query: graphqlQuery, operationName: graphqlOperationName } = requestBody;
    const { operationName = graphqlOperationName, operationType } = parseGraphQLQuery(graphqlQuery);
    const operationInfo = operationName ? `${operationType} ${operationName}` : `${operationType}`;
    return operationInfo;
  }
  return "unknown";
}
function getRequestPayloadXhrOrFetch(hint) {
  const isXhr = "xhr" in hint;
  let body;
  if (isXhr) {
    const sentryXhrData = hint.xhr[SENTRY_XHR_DATA_KEY];
    body = sentryXhrData && getBodyString(sentryXhrData.body)[0];
  } else {
    const sentryFetchData = getFetchRequestArgBody(hint.input);
    body = getBodyString(sentryFetchData)[0];
  }
  return body;
}
function parseGraphQLQuery(query) {
  const namedQueryRe = /^(?:\s*)(query|mutation|subscription)(?:\s*)(\w+)(?:\s*)[{(]/;
  const unnamedQueryRe = /^(?:\s*)(query|mutation|subscription)(?:\s*)[{(]/;
  const namedMatch = query.match(namedQueryRe);
  if (namedMatch) {
    return {
      operationType: namedMatch[1],
      operationName: namedMatch[2]
    };
  }
  const unnamedMatch = query.match(unnamedQueryRe);
  if (unnamedMatch) {
    return {
      operationType: unnamedMatch[1],
      operationName: void 0
    };
  }
  return {
    operationType: void 0,
    operationName: void 0
  };
}
function isObject(value) {
  return typeof value === "object" && value !== null;
}
function isStandardRequest(payload) {
  return isObject(payload) && typeof payload.query === "string";
}
function isPersistedRequest(payload) {
  return isObject(payload) && typeof payload.operationName === "string" && isObject(payload.extensions) && isObject(payload.extensions.persistedQuery) && typeof payload.extensions.persistedQuery.sha256Hash === "string" && typeof payload.extensions.persistedQuery.version === "number";
}
function getGraphQLRequestPayload(payload) {
  try {
    const requestBody = JSON.parse(payload);
    if (isStandardRequest(requestBody) || isPersistedRequest(requestBody)) {
      return requestBody;
    }
    return void 0;
  } catch {
    return void 0;
  }
}
const graphqlClientIntegration = defineIntegration(_graphqlClientIntegration);
const viewHierarchyIntegration = defineIntegration((options = {}) => {
  const skipHtmlTags = ["script"];
  function walk(element, windows, depth = 0) {
    if (!element) {
      return;
    }
    const children = "shadowRoot" in element && element.shadowRoot ? element.shadowRoot.children : element.children;
    for (const child of children) {
      if (!(child instanceof HTMLElement)) {
        continue;
      }
      const componentName = getComponentName(child, 1) || void 0;
      const tagName = child.tagName.toLowerCase();
      if (skipHtmlTags.includes(tagName)) {
        continue;
      }
      const result = options.onElement?.({ element: child, componentName, tagName, depth }) || {};
      if (result === "skip") {
        continue;
      }
      if (result === "children") {
        walk(child, windows, depth + 1);
        continue;
      }
      const { x: x2, y: y2, width, height } = child.getBoundingClientRect();
      const window2 = {
        identifier: child.id || void 0,
        type: componentName || tagName,
        visible: true,
        alpha: 1,
        height,
        width,
        x: x2,
        y: y2,
        ...result
      };
      const children2 = [];
      window2.children = children2;
      walk(child, window2.children, depth + 1);
      windows.push(window2);
    }
  }
  return {
    name: "ViewHierarchy",
    processEvent: (event, hint) => {
      if (event.type !== void 0 || options.shouldAttach?.(event, hint) === false) {
        return event;
      }
      const root = {
        rendering_system: "DOM",
        positioning: "absolute",
        windows: []
      };
      walk(options.rootElement?.() || WINDOW$4.document.body, root.windows);
      const attachment = {
        filename: "view-hierarchy.json",
        attachmentType: "event.view_hierarchy",
        contentType: "application/json",
        data: JSON.stringify(root)
      };
      hint.attachments = hint.attachments || [];
      hint.attachments.push(attachment);
      return event;
    }
  };
});
const WINDOW = GLOBAL_OBJ;
const REPLAY_SESSION_KEY = "sentryReplaySession";
const REPLAY_EVENT_NAME = "replay_event";
const UNABLE_TO_SEND_REPLAY = "Unable to send Replay";
const SESSION_IDLE_PAUSE_DURATION = 3e5;
const SESSION_IDLE_EXPIRE_DURATION = 9e5;
const DEFAULT_FLUSH_MIN_DELAY = 5e3;
const DEFAULT_FLUSH_MAX_DELAY = 5500;
const BUFFER_CHECKOUT_TIME = 6e4;
const RETRY_BASE_INTERVAL = 5e3;
const RETRY_MAX_COUNT = 3;
const NETWORK_BODY_MAX_SIZE = 15e4;
const CONSOLE_ARG_MAX_SIZE = 5e3;
const SLOW_CLICK_THRESHOLD = 3e3;
const SLOW_CLICK_SCROLL_TIMEOUT = 300;
const REPLAY_MAX_EVENT_BUFFER_SIZE = 2e7;
const MIN_REPLAY_DURATION = 4999;
const MIN_REPLAY_DURATION_LIMIT = 5e4;
const MAX_REPLAY_DURATION = 36e5;
var __defProp$1 = Object.defineProperty;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$1 = (obj, key, value) => __defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
var NodeType$1 = /* @__PURE__ */ ((NodeType2) => {
  NodeType2[NodeType2["Document"] = 0] = "Document";
  NodeType2[NodeType2["DocumentType"] = 1] = "DocumentType";
  NodeType2[NodeType2["Element"] = 2] = "Element";
  NodeType2[NodeType2["Text"] = 3] = "Text";
  NodeType2[NodeType2["CDATA"] = 4] = "CDATA";
  NodeType2[NodeType2["Comment"] = 5] = "Comment";
  return NodeType2;
})(NodeType$1 || {});
function isElement$1(n2) {
  return n2.nodeType === n2.ELEMENT_NODE;
}
function isShadowRoot(n2) {
  const host = n2?.host;
  return Boolean(host?.shadowRoot === n2);
}
function isNativeShadowDom(shadowRoot) {
  return Object.prototype.toString.call(shadowRoot) === "[object ShadowRoot]";
}
function fixBrowserCompatibilityIssuesInCSS(cssText) {
  if (cssText.includes(" background-clip: text;") && !cssText.includes(" -webkit-background-clip: text;")) {
    cssText = cssText.replace(
      /\sbackground-clip:\s*text;/g,
      " -webkit-background-clip: text; background-clip: text;"
    );
  }
  return cssText;
}
function escapeImportStatement(rule) {
  const { cssText } = rule;
  if (cssText.split('"').length < 3) return cssText;
  const statement = ["@import", `url(${JSON.stringify(rule.href)})`];
  if (rule.layerName === "") {
    statement.push(`layer`);
  } else if (rule.layerName) {
    statement.push(`layer(${rule.layerName})`);
  }
  if (rule.supportsText) {
    statement.push(`supports(${rule.supportsText})`);
  }
  if (rule.media.length) {
    statement.push(rule.media.mediaText);
  }
  return statement.join(" ") + ";";
}
function stringifyStylesheet(s2) {
  try {
    const rules = s2.rules || s2.cssRules;
    return rules ? fixBrowserCompatibilityIssuesInCSS(
      Array.from(rules, stringifyRule).join("")
    ) : null;
  } catch (error2) {
    return null;
  }
}
function fixAllCssProperty(rule) {
  let styles = "";
  for (let i = 0; i < rule.style.length; i++) {
    const styleDeclaration = rule.style;
    const attribute = styleDeclaration[i];
    const isImportant = styleDeclaration.getPropertyPriority(attribute);
    styles += `${attribute}:${styleDeclaration.getPropertyValue(attribute)}${isImportant ? ` !important` : ""};`;
  }
  return `${rule.selectorText} { ${styles} }`;
}
function stringifyRule(rule) {
  let importStringified;
  if (isCSSImportRule(rule)) {
    try {
      importStringified = // for same-origin stylesheets,
      // we can access the imported stylesheet rules directly
      stringifyStylesheet(rule.styleSheet) || // work around browser issues with the raw string `@import url(...)` statement
      escapeImportStatement(rule);
    } catch (error2) {
    }
  } else if (isCSSStyleRule(rule)) {
    let cssText = rule.cssText;
    const needsSafariColonFix = rule.selectorText.includes(":");
    const needsAllFix = typeof rule.style["all"] === "string" && rule.style["all"];
    if (needsAllFix) {
      cssText = fixAllCssProperty(rule);
    }
    if (needsSafariColonFix) {
      cssText = fixSafariColons(cssText);
    }
    if (needsSafariColonFix || needsAllFix) {
      return cssText;
    }
  }
  return importStringified || rule.cssText;
}
function fixSafariColons(cssStringified) {
  const regex = /(\[(?:[\w-]+)[^\\])(:(?:[\w-]+)\])/gm;
  return cssStringified.replace(regex, "$1\\$2");
}
function isCSSImportRule(rule) {
  return "styleSheet" in rule;
}
function isCSSStyleRule(rule) {
  return "selectorText" in rule;
}
let Mirror$1 = class Mirror {
  constructor() {
    __publicField$1(this, "idNodeMap", /* @__PURE__ */ new Map());
    __publicField$1(this, "nodeMetaMap", /* @__PURE__ */ new WeakMap());
  }
  getId(n2) {
    if (!n2) return -1;
    const id = this.getMeta(n2)?.id;
    return id ?? -1;
  }
  getNode(id) {
    return this.idNodeMap.get(id) || null;
  }
  getIds() {
    return Array.from(this.idNodeMap.keys());
  }
  getMeta(n2) {
    return this.nodeMetaMap.get(n2) || null;
  }
  // removes the node from idNodeMap
  // doesn't remove the node from nodeMetaMap
  removeNodeFromMap(n2) {
    const id = this.getId(n2);
    this.idNodeMap.delete(id);
    if (n2.childNodes) {
      n2.childNodes.forEach(
        (childNode) => this.removeNodeFromMap(childNode)
      );
    }
  }
  has(id) {
    return this.idNodeMap.has(id);
  }
  hasNode(node) {
    return this.nodeMetaMap.has(node);
  }
  add(n2, meta) {
    const id = meta.id;
    this.idNodeMap.set(id, n2);
    this.nodeMetaMap.set(n2, meta);
  }
  replace(id, n2) {
    const oldNode = this.getNode(id);
    if (oldNode) {
      const meta = this.nodeMetaMap.get(oldNode);
      if (meta) this.nodeMetaMap.set(n2, meta);
    }
    this.idNodeMap.set(id, n2);
  }
  reset() {
    this.idNodeMap = /* @__PURE__ */ new Map();
    this.nodeMetaMap = /* @__PURE__ */ new WeakMap();
  }
};
function createMirror$1() {
  return new Mirror$1();
}
function shouldMaskInput({
  maskInputOptions,
  tagName,
  type
}) {
  if (tagName === "OPTION") {
    tagName = "SELECT";
  }
  return Boolean(
    maskInputOptions[tagName.toLowerCase()] || type && maskInputOptions[type] || type === "password" || // Default to "text" option for inputs without a "type" attribute defined
    tagName === "INPUT" && !type && maskInputOptions["text"]
  );
}
function maskInputValue({
  isMasked,
  element,
  value,
  maskInputFn
}) {
  let text = value || "";
  if (!isMasked) {
    return text;
  }
  if (maskInputFn) {
    text = maskInputFn(text, element);
  }
  return "*".repeat(text.length);
}
function toLowerCase(str) {
  return str.toLowerCase();
}
function toUpperCase(str) {
  return str.toUpperCase();
}
const ORIGINAL_ATTRIBUTE_NAME = "__rrweb_original__";
function is2DCanvasBlank(canvas) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return true;
  const chunkSize = 50;
  for (let x2 = 0; x2 < canvas.width; x2 += chunkSize) {
    for (let y2 = 0; y2 < canvas.height; y2 += chunkSize) {
      const getImageData = ctx.getImageData;
      const originalGetImageData = ORIGINAL_ATTRIBUTE_NAME in getImageData ? getImageData[ORIGINAL_ATTRIBUTE_NAME] : getImageData;
      const pixelBuffer = new Uint32Array(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        originalGetImageData.call(
          ctx,
          x2,
          y2,
          Math.min(chunkSize, canvas.width - x2),
          Math.min(chunkSize, canvas.height - y2)
        ).data.buffer
      );
      if (pixelBuffer.some((pixel) => pixel !== 0)) return false;
    }
  }
  return true;
}
function getInputType(element) {
  const type = element.type;
  return element.hasAttribute("data-rr-is-password") ? "password" : type ? (
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    toLowerCase(type)
  ) : null;
}
function getInputValue(el, tagName, type) {
  if (tagName === "INPUT" && (type === "radio" || type === "checkbox")) {
    return el.getAttribute("value") || "";
  }
  return el.value;
}
function extractFileExtension(path, baseURL) {
  let url;
  try {
    url = new URL(path, baseURL ?? window.location.href);
  } catch (err) {
    return null;
  }
  const regex = /\.([0-9a-z]+)(?:$)/i;
  const match = url.pathname.match(regex);
  return match?.[1] ?? null;
}
const cachedImplementations$1 = {};
function getImplementation$1(name) {
  const cached = cachedImplementations$1[name];
  if (cached) {
    return cached;
  }
  const document2 = window.document;
  let impl = window[name];
  if (document2 && typeof document2.createElement === "function") {
    try {
      const sandbox = document2.createElement("iframe");
      sandbox.hidden = true;
      document2.head.appendChild(sandbox);
      const contentWindow = sandbox.contentWindow;
      if (contentWindow && contentWindow[name]) {
        impl = // eslint-disable-next-line @typescript-eslint/unbound-method
        contentWindow[name];
      }
      document2.head.removeChild(sandbox);
    } catch (e2) {
    }
  }
  return cachedImplementations$1[name] = impl.bind(
    window
  );
}
function setTimeout$1$1(...rest) {
  return getImplementation$1("setTimeout")(...rest);
}
function clearTimeout$1(...rest) {
  return getImplementation$1("clearTimeout")(...rest);
}
function getIFrameContentDocument$1(iframe) {
  try {
    return iframe.contentDocument;
  } catch {
  }
}
function getIFrameContentWindow$1(iframe) {
  try {
    return iframe.contentWindow;
  } catch {
  }
}
let _id = 1;
const tagNameRegex = new RegExp("[^a-z0-9-_:]");
const IGNORED_NODE = -2;
function genId() {
  return _id++;
}
function getValidTagName(element) {
  if (element instanceof HTMLFormElement) {
    return "form";
  }
  const processedTagName = toLowerCase(element.tagName);
  if (tagNameRegex.test(processedTagName)) {
    return "div";
  }
  return processedTagName;
}
function extractOrigin(url) {
  let origin = "";
  if (url.indexOf("//") > -1) {
    origin = url.split("/").slice(0, 3).join("/");
  } else {
    origin = url.split("/")[0];
  }
  origin = origin.split("?")[0];
  return origin;
}
let canvasService;
let canvasCtx;
const URL_IN_CSS_REF = /url\((?:(')([^']*)'|(")(.*?)"|([^)]*))\)/gm;
const URL_PROTOCOL_MATCH = /^(?:[a-z+]+:)?\/\//i;
const URL_WWW_MATCH = /^www\..*/i;
const DATA_URI = /^(data:)([^,]*),(.*)/i;
function filterCSSPropertiesFromInlineStyle(cssText, ignoredProperties) {
  if (!cssText || ignoredProperties.size === 0) {
    return cssText;
  }
  try {
    const properties = cssText.split(";");
    const filteredProperties = [];
    for (let property of properties) {
      property = property.trim();
      if (!property) continue;
      const colonIndex = property.indexOf(":");
      if (colonIndex === -1) {
        filteredProperties.push(property);
        continue;
      }
      const propertyName = property.slice(0, colonIndex).trim();
      if (!ignoredProperties.has(propertyName)) {
        filteredProperties.push(property);
      }
    }
    return filteredProperties.join("; ") + (filteredProperties.length > 0 && cssText.endsWith(";") ? ";" : "");
  } catch (error2) {
    console.warn("Error filtering CSS properties:", error2);
    return cssText;
  }
}
function absoluteToStylesheet(cssText, href) {
  return (cssText || "").replace(
    URL_IN_CSS_REF,
    (origin, quote1, path1, quote2, path2, path3) => {
      const filePath = path1 || path2 || path3;
      const maybeQuote = quote1 || quote2 || "";
      if (!filePath) {
        return origin;
      }
      if (URL_PROTOCOL_MATCH.test(filePath) || URL_WWW_MATCH.test(filePath)) {
        return `url(${maybeQuote}${filePath}${maybeQuote})`;
      }
      if (DATA_URI.test(filePath)) {
        return `url(${maybeQuote}${filePath}${maybeQuote})`;
      }
      if (filePath[0] === "/") {
        return `url(${maybeQuote}${extractOrigin(href) + filePath}${maybeQuote})`;
      }
      const stack = href.split("/");
      const parts = filePath.split("/");
      stack.pop();
      for (const part of parts) {
        if (part === ".") {
          continue;
        } else if (part === "..") {
          stack.pop();
        } else {
          stack.push(part);
        }
      }
      return `url(${maybeQuote}${stack.join("/")}${maybeQuote})`;
    }
  );
}
const SRCSET_NOT_SPACES = /^[^ \t\n\r\u000c]+/;
const SRCSET_COMMAS_OR_SPACES = /^[, \t\n\r\u000c]+/;
function getAbsoluteSrcsetString(doc, attributeValue) {
  if (attributeValue.trim() === "") {
    return attributeValue;
  }
  let pos = 0;
  function collectCharacters(regEx) {
    let chars2;
    const match = regEx.exec(attributeValue.substring(pos));
    if (match) {
      chars2 = match[0];
      pos += chars2.length;
      return chars2;
    }
    return "";
  }
  const output = [];
  while (true) {
    collectCharacters(SRCSET_COMMAS_OR_SPACES);
    if (pos >= attributeValue.length) {
      break;
    }
    let url = collectCharacters(SRCSET_NOT_SPACES);
    if (url.slice(-1) === ",") {
      url = absoluteToDoc(doc, url.substring(0, url.length - 1));
      output.push(url);
    } else {
      let descriptorsStr = "";
      url = absoluteToDoc(doc, url);
      let inParens = false;
      while (true) {
        const c2 = attributeValue.charAt(pos);
        if (c2 === "") {
          output.push((url + descriptorsStr).trim());
          break;
        } else if (!inParens) {
          if (c2 === ",") {
            pos += 1;
            output.push((url + descriptorsStr).trim());
            break;
          } else if (c2 === "(") {
            inParens = true;
          }
        } else {
          if (c2 === ")") {
            inParens = false;
          }
        }
        descriptorsStr += c2;
        pos += 1;
      }
    }
  }
  return output.join(", ");
}
const cachedDocument = /* @__PURE__ */ new WeakMap();
function absoluteToDoc(doc, attributeValue) {
  if (!attributeValue || attributeValue.trim() === "") {
    return attributeValue;
  }
  return getHref(doc, attributeValue);
}
function isSVGElement(el) {
  return Boolean(el.tagName === "svg" || el.ownerSVGElement);
}
function getHref(doc, customHref) {
  let a2 = cachedDocument.get(doc);
  if (!a2) {
    a2 = doc.createElement("a");
    cachedDocument.set(doc, a2);
  }
  if (!customHref) {
    customHref = "";
  } else if (customHref.startsWith("blob:") || customHref.startsWith("data:")) {
    return customHref;
  }
  a2.setAttribute("href", customHref);
  return a2.href;
}
function transformAttribute(doc, tagName, name, value, element, maskAttributeFn, ignoreCSSAttributes) {
  if (!value) {
    return value;
  }
  if (name === "src" || name === "href" && !(tagName === "use" && value[0] === "#")) {
    return absoluteToDoc(doc, value);
  } else if (name === "xlink:href" && value[0] !== "#") {
    return absoluteToDoc(doc, value);
  } else if (name === "background" && (tagName === "table" || tagName === "td" || tagName === "th")) {
    return absoluteToDoc(doc, value);
  } else if (name === "srcset") {
    return getAbsoluteSrcsetString(doc, value);
  } else if (name === "style") {
    let processedStyle = absoluteToStylesheet(value, getHref(doc));
    if (ignoreCSSAttributes && ignoreCSSAttributes.size > 0) {
      processedStyle = filterCSSPropertiesFromInlineStyle(
        processedStyle,
        ignoreCSSAttributes
      );
    }
    return processedStyle;
  } else if (tagName === "object" && name === "data") {
    return absoluteToDoc(doc, value);
  }
  if (typeof maskAttributeFn === "function") {
    return maskAttributeFn(name, value, element);
  }
  return value;
}
function ignoreAttribute(tagName, name, _value) {
  return (tagName === "video" || tagName === "audio") && name === "autoplay";
}
function _isBlockedElement(element, blockClass, blockSelector, unblockSelector) {
  try {
    if (unblockSelector && element.matches(unblockSelector)) {
      return false;
    }
    if (typeof blockClass === "string") {
      if (element.classList.contains(blockClass)) {
        return true;
      }
    } else {
      for (let eIndex = element.classList.length; eIndex--; ) {
        const className = element.classList[eIndex];
        if (blockClass.test(className)) {
          return true;
        }
      }
    }
    if (blockSelector) {
      return element.matches(blockSelector);
    }
  } catch (e2) {
  }
  return false;
}
function elementClassMatchesRegex$1(el, regex) {
  for (let eIndex = el.classList.length; eIndex--; ) {
    const className = el.classList[eIndex];
    if (regex.test(className)) {
      return true;
    }
  }
  return false;
}
function distanceToMatch$1(node, matchPredicate, limit = Infinity, distance = 0) {
  if (!node) return -1;
  if (node.nodeType !== node.ELEMENT_NODE) return -1;
  if (distance > limit) return -1;
  if (matchPredicate(node)) return distance;
  return distanceToMatch$1(node.parentNode, matchPredicate, limit, distance + 1);
}
function createMatchPredicate$1(className, selector) {
  return (node) => {
    const el = node;
    if (el === null) return false;
    try {
      if (className) {
        if (typeof className === "string") {
          if (el.matches(`.${className}`)) return true;
        } else if (elementClassMatchesRegex$1(el, className)) {
          return true;
        }
      }
      if (selector && el.matches(selector)) return true;
      return false;
    } catch {
      return false;
    }
  };
}
function needMaskingText(node, maskTextClass, maskTextSelector, unmaskTextClass, unmaskTextSelector, maskAllText) {
  try {
    const el = node.nodeType === node.ELEMENT_NODE ? node : node.parentElement;
    if (el === null) return false;
    if (el.tagName === "INPUT") {
      const autocomplete = el.getAttribute("autocomplete");
      const disallowedAutocompleteValues = [
        "current-password",
        "new-password",
        "cc-number",
        "cc-exp",
        "cc-exp-month",
        "cc-exp-year",
        "cc-csc"
      ];
      if (disallowedAutocompleteValues.includes(autocomplete)) {
        return true;
      }
    }
    let maskDistance = -1;
    let unmaskDistance = -1;
    if (maskAllText) {
      unmaskDistance = distanceToMatch$1(
        el,
        createMatchPredicate$1(unmaskTextClass, unmaskTextSelector)
      );
      if (unmaskDistance < 0) {
        return true;
      }
      maskDistance = distanceToMatch$1(
        el,
        createMatchPredicate$1(maskTextClass, maskTextSelector),
        unmaskDistance >= 0 ? unmaskDistance : Infinity
      );
    } else {
      maskDistance = distanceToMatch$1(
        el,
        createMatchPredicate$1(maskTextClass, maskTextSelector)
      );
      if (maskDistance < 0) {
        return false;
      }
      unmaskDistance = distanceToMatch$1(
        el,
        createMatchPredicate$1(unmaskTextClass, unmaskTextSelector),
        maskDistance >= 0 ? maskDistance : Infinity
      );
    }
    return maskDistance >= 0 ? unmaskDistance >= 0 ? maskDistance <= unmaskDistance : true : unmaskDistance >= 0 ? false : !!maskAllText;
  } catch (e2) {
  }
  return !!maskAllText;
}
function onceIframeLoaded(iframeEl, listener, iframeLoadTimeout) {
  const win = getIFrameContentWindow$1(iframeEl);
  if (!win) {
    return;
  }
  let fired = false;
  let readyState;
  try {
    readyState = win.document.readyState;
  } catch (error2) {
    return;
  }
  if (readyState !== "complete") {
    const timer = setTimeout$1$1(() => {
      if (!fired) {
        listener();
        fired = true;
      }
    }, iframeLoadTimeout);
    iframeEl.addEventListener("load", () => {
      clearTimeout$1(timer);
      fired = true;
      listener();
    });
    return;
  }
  const blankUrl = "about:blank";
  if (win.location.href !== blankUrl || iframeEl.src === blankUrl || iframeEl.src === "") {
    setTimeout$1$1(listener, 0);
    return iframeEl.addEventListener("load", listener);
  }
  iframeEl.addEventListener("load", listener);
}
function onceStylesheetLoaded(link, listener, styleSheetLoadTimeout) {
  let fired = false;
  let styleSheetLoaded;
  try {
    styleSheetLoaded = link.sheet;
  } catch (error2) {
    styleSheetLoaded = null;
  }
  if (styleSheetLoaded) return;
  const timer = setTimeout$1$1(() => {
    if (!fired) {
      listener();
      fired = true;
    }
  }, styleSheetLoadTimeout);
  link.addEventListener("load", () => {
    clearTimeout$1(timer);
    fired = true;
    listener();
  });
}
function serializeNode(n2, options) {
  const {
    doc,
    mirror: mirror2,
    blockClass,
    blockSelector,
    unblockSelector,
    maskAllText,
    maskAttributeFn,
    maskTextClass,
    unmaskTextClass,
    maskTextSelector,
    unmaskTextSelector,
    inlineStylesheet,
    maskInputOptions = {},
    maskTextFn,
    maskInputFn,
    dataURLOptions = {},
    inlineImages,
    recordCanvas,
    keepIframeSrcFn,
    newlyAddedElement = false,
    ignoreCSSAttributes
  } = options;
  const rootId = getRootId(doc, mirror2);
  switch (n2.nodeType) {
    case n2.DOCUMENT_NODE:
      if (n2.compatMode !== "CSS1Compat") {
        return {
          type: NodeType$1.Document,
          childNodes: [],
          compatMode: n2.compatMode
          // probably "BackCompat"
        };
      } else {
        return {
          type: NodeType$1.Document,
          childNodes: []
        };
      }
    case n2.DOCUMENT_TYPE_NODE:
      return {
        type: NodeType$1.DocumentType,
        name: n2.name,
        publicId: n2.publicId,
        systemId: n2.systemId,
        rootId
      };
    case n2.ELEMENT_NODE:
      return serializeElementNode(n2, {
        doc,
        blockClass,
        blockSelector,
        unblockSelector,
        inlineStylesheet,
        maskAttributeFn,
        maskInputOptions,
        maskInputFn,
        dataURLOptions,
        inlineImages,
        recordCanvas,
        keepIframeSrcFn,
        newlyAddedElement,
        rootId,
        maskTextClass,
        unmaskTextClass,
        maskTextSelector,
        unmaskTextSelector,
        ignoreCSSAttributes
      });
    case n2.TEXT_NODE:
      return serializeTextNode(n2, {
        doc,
        maskAllText,
        maskTextClass,
        unmaskTextClass,
        maskTextSelector,
        unmaskTextSelector,
        maskTextFn,
        maskInputOptions,
        maskInputFn,
        rootId
      });
    case n2.CDATA_SECTION_NODE:
      return {
        type: NodeType$1.CDATA,
        textContent: "",
        rootId
      };
    case n2.COMMENT_NODE:
      return {
        type: NodeType$1.Comment,
        textContent: n2.textContent || "",
        rootId
      };
    default:
      return false;
  }
}
function getRootId(doc, mirror2) {
  if (!mirror2.hasNode(doc)) return void 0;
  const docId = mirror2.getId(doc);
  return docId === 1 ? void 0 : docId;
}
function serializeTextNode(n2, options) {
  const {
    maskAllText,
    maskTextClass,
    unmaskTextClass,
    maskTextSelector,
    unmaskTextSelector,
    maskTextFn,
    maskInputOptions,
    maskInputFn,
    rootId
  } = options;
  const parentTagName = n2.parentNode && n2.parentNode.tagName;
  let textContent = n2.textContent;
  const isStyle = parentTagName === "STYLE" ? true : void 0;
  const isScript = parentTagName === "SCRIPT" ? true : void 0;
  const isTextarea = parentTagName === "TEXTAREA" ? true : void 0;
  if (isStyle && textContent) {
    try {
      if (n2.nextSibling || n2.previousSibling) {
      } else if (n2.parentNode.sheet?.cssRules) {
        textContent = stringifyStylesheet(
          n2.parentNode.sheet
        );
      }
    } catch (err) {
      console.warn(
        `Cannot get CSS styles from text's parentNode. Error: ${err}`,
        n2
      );
    }
    textContent = absoluteToStylesheet(textContent, getHref(options.doc));
  }
  if (isScript) {
    textContent = "SCRIPT_PLACEHOLDER";
  }
  const forceMask = needMaskingText(
    n2,
    maskTextClass,
    maskTextSelector,
    unmaskTextClass,
    unmaskTextSelector,
    maskAllText
  );
  if (!isStyle && !isScript && !isTextarea && textContent && forceMask) {
    textContent = maskTextFn ? maskTextFn(textContent, n2.parentElement) : textContent.replace(/[\S]/g, "*");
  }
  if (isTextarea && textContent && (maskInputOptions.textarea || forceMask)) {
    textContent = maskInputFn ? maskInputFn(textContent, n2.parentNode) : textContent.replace(/[\S]/g, "*");
  }
  if (parentTagName === "OPTION" && textContent) {
    const isInputMasked = shouldMaskInput({
      type: null,
      tagName: parentTagName,
      maskInputOptions
    });
    textContent = maskInputValue({
      isMasked: needMaskingText(
        n2,
        maskTextClass,
        maskTextSelector,
        unmaskTextClass,
        unmaskTextSelector,
        isInputMasked
      ),
      element: n2,
      value: textContent,
      maskInputFn
    });
  }
  return {
    type: NodeType$1.Text,
    textContent: textContent || "",
    isStyle,
    rootId
  };
}
function serializeElementNode(n2, options) {
  const {
    doc,
    blockClass,
    blockSelector,
    unblockSelector,
    inlineStylesheet,
    maskInputOptions = {},
    maskAttributeFn,
    maskInputFn,
    dataURLOptions = {},
    inlineImages,
    recordCanvas,
    keepIframeSrcFn,
    newlyAddedElement = false,
    rootId,
    maskTextClass,
    unmaskTextClass,
    maskTextSelector,
    unmaskTextSelector,
    ignoreCSSAttributes
  } = options;
  const needBlock = _isBlockedElement(
    n2,
    blockClass,
    blockSelector,
    unblockSelector
  );
  const tagName = getValidTagName(n2);
  let attributes2 = {};
  const len = n2.attributes.length;
  for (let i = 0; i < len; i++) {
    const attr = n2.attributes[i];
    if (attr.name && !ignoreAttribute(tagName, attr.name, attr.value)) {
      attributes2[attr.name] = transformAttribute(
        doc,
        tagName,
        toLowerCase(attr.name),
        attr.value,
        n2,
        maskAttributeFn,
        ignoreCSSAttributes
      );
    }
  }
  if (tagName === "link" && inlineStylesheet) {
    const stylesheet = Array.from(doc.styleSheets).find((s2) => {
      return s2.href === n2.href;
    });
    let cssText = null;
    if (stylesheet) {
      cssText = stringifyStylesheet(stylesheet);
    }
    if (cssText) {
      attributes2.rel = null;
      attributes2.href = null;
      attributes2.crossorigin = null;
      attributes2._cssText = absoluteToStylesheet(cssText, stylesheet.href);
    }
  }
  if (tagName === "style" && n2.sheet && // TODO: Currently we only try to get dynamic stylesheet when it is an empty style element
  !(n2.innerText || n2.textContent || "").trim().length) {
    const cssText = stringifyStylesheet(
      n2.sheet
    );
    if (cssText) {
      attributes2._cssText = absoluteToStylesheet(cssText, getHref(doc));
    }
  }
  if (tagName === "input" || tagName === "textarea" || tagName === "select" || tagName === "option") {
    const el = n2;
    const type = getInputType(el);
    const value = getInputValue(el, toUpperCase(tagName), type);
    const checked = el.checked;
    if (type !== "submit" && type !== "button" && value) {
      const forceMask = needMaskingText(
        el,
        maskTextClass,
        maskTextSelector,
        unmaskTextClass,
        unmaskTextSelector,
        shouldMaskInput({
          type,
          tagName: toUpperCase(tagName),
          maskInputOptions
        })
      );
      attributes2.value = maskInputValue({
        isMasked: forceMask,
        element: el,
        value,
        maskInputFn
      });
    }
    if (checked) {
      attributes2.checked = checked;
    }
  }
  if (tagName === "option") {
    if (n2.selected && !maskInputOptions["select"]) {
      attributes2.selected = true;
    } else {
      delete attributes2.selected;
    }
  }
  if (tagName === "canvas" && recordCanvas) {
    if (n2.__context === "2d") {
      if (!is2DCanvasBlank(n2)) {
        attributes2.rr_dataURL = n2.toDataURL(
          dataURLOptions.type,
          dataURLOptions.quality
        );
      }
    } else if (!("__context" in n2)) {
      const canvasDataURL = n2.toDataURL(
        dataURLOptions.type,
        dataURLOptions.quality
      );
      const blankCanvas = doc.createElement("canvas");
      blankCanvas.width = n2.width;
      blankCanvas.height = n2.height;
      const blankCanvasDataURL = blankCanvas.toDataURL(
        dataURLOptions.type,
        dataURLOptions.quality
      );
      if (canvasDataURL !== blankCanvasDataURL) {
        attributes2.rr_dataURL = canvasDataURL;
      }
    }
  }
  if (tagName === "img" && inlineImages) {
    if (!canvasService) {
      canvasService = doc.createElement("canvas");
      canvasCtx = canvasService.getContext("2d");
    }
    const image = n2;
    const imageSrc = image.currentSrc || image.getAttribute("src") || "<unknown-src>";
    const priorCrossOrigin = image.crossOrigin;
    const recordInlineImage = () => {
      image.removeEventListener("load", recordInlineImage);
      try {
        canvasService.width = image.naturalWidth;
        canvasService.height = image.naturalHeight;
        canvasCtx.drawImage(image, 0, 0);
        attributes2.rr_dataURL = canvasService.toDataURL(
          dataURLOptions.type,
          dataURLOptions.quality
        );
      } catch (err) {
        if (image.crossOrigin !== "anonymous") {
          image.crossOrigin = "anonymous";
          if (image.complete && image.naturalWidth !== 0)
            recordInlineImage();
          else image.addEventListener("load", recordInlineImage);
          return;
        } else {
          console.warn(
            `Cannot inline img src=${imageSrc}! Error: ${err}`
          );
        }
      }
      if (image.crossOrigin === "anonymous") {
        priorCrossOrigin ? attributes2.crossOrigin = priorCrossOrigin : image.removeAttribute("crossorigin");
      }
    };
    if (image.complete && image.naturalWidth !== 0) recordInlineImage();
    else image.addEventListener("load", recordInlineImage);
  }
  if (tagName === "audio" || tagName === "video") {
    attributes2.rr_mediaState = n2.paused ? "paused" : "played";
    attributes2.rr_mediaCurrentTime = n2.currentTime;
  }
  if (!newlyAddedElement) {
    if (n2.scrollLeft) {
      attributes2.rr_scrollLeft = n2.scrollLeft;
    }
    if (n2.scrollTop) {
      attributes2.rr_scrollTop = n2.scrollTop;
    }
  }
  if (needBlock) {
    const { width, height } = n2.getBoundingClientRect();
    attributes2 = {
      class: attributes2.class,
      rr_width: `${width}px`,
      rr_height: `${height}px`
    };
  }
  if (tagName === "iframe" && !keepIframeSrcFn(attributes2.src)) {
    if (!needBlock && !getIFrameContentDocument$1(n2)) {
      attributes2.rr_src = attributes2.src;
    }
    delete attributes2.src;
  }
  let isCustomElement;
  try {
    if (customElements.get(tagName)) isCustomElement = true;
  } catch (e2) {
  }
  return {
    type: NodeType$1.Element,
    tagName,
    attributes: attributes2,
    childNodes: [],
    isSVG: isSVGElement(n2) || void 0,
    needBlock,
    rootId,
    isCustom: isCustomElement
  };
}
function lowerIfExists(maybeAttr) {
  if (maybeAttr === void 0 || maybeAttr === null) {
    return "";
  } else {
    return maybeAttr.toLowerCase();
  }
}
function slimDOMExcluded(sn, slimDOMOptions) {
  if (slimDOMOptions.comment && sn.type === NodeType$1.Comment) {
    return true;
  } else if (sn.type === NodeType$1.Element) {
    if (slimDOMOptions.script && // script tag
    (sn.tagName === "script" || // (module)preload link
    sn.tagName === "link" && (sn.attributes.rel === "preload" || sn.attributes.rel === "modulepreload") || // prefetch link
    sn.tagName === "link" && sn.attributes.rel === "prefetch" && typeof sn.attributes.href === "string" && extractFileExtension(sn.attributes.href) === "js")) {
      return true;
    } else if (slimDOMOptions.headFavicon && (sn.tagName === "link" && sn.attributes.rel === "shortcut icon" || sn.tagName === "meta" && (lowerIfExists(sn.attributes.name).match(
      /^msapplication-tile(image|color)$/
    ) || lowerIfExists(sn.attributes.name) === "application-name" || lowerIfExists(sn.attributes.rel) === "icon" || lowerIfExists(sn.attributes.rel) === "apple-touch-icon" || lowerIfExists(sn.attributes.rel) === "shortcut icon"))) {
      return true;
    } else if (sn.tagName === "meta") {
      if (slimDOMOptions.headMetaDescKeywords && lowerIfExists(sn.attributes.name).match(/^description|keywords$/)) {
        return true;
      } else if (slimDOMOptions.headMetaSocial && (lowerIfExists(sn.attributes.property).match(/^(og|twitter|fb):/) || // og = opengraph (facebook)
      lowerIfExists(sn.attributes.name).match(/^(og|twitter):/) || lowerIfExists(sn.attributes.name) === "pinterest")) {
        return true;
      } else if (slimDOMOptions.headMetaRobots && (lowerIfExists(sn.attributes.name) === "robots" || lowerIfExists(sn.attributes.name) === "googlebot" || lowerIfExists(sn.attributes.name) === "bingbot")) {
        return true;
      } else if (slimDOMOptions.headMetaHttpEquiv && sn.attributes["http-equiv"] !== void 0) {
        return true;
      } else if (slimDOMOptions.headMetaAuthorship && (lowerIfExists(sn.attributes.name) === "author" || lowerIfExists(sn.attributes.name) === "generator" || lowerIfExists(sn.attributes.name) === "framework" || lowerIfExists(sn.attributes.name) === "publisher" || lowerIfExists(sn.attributes.name) === "progid" || lowerIfExists(sn.attributes.property).match(/^article:/) || lowerIfExists(sn.attributes.property).match(/^product:/))) {
        return true;
      } else if (slimDOMOptions.headMetaVerification && (lowerIfExists(sn.attributes.name) === "google-site-verification" || lowerIfExists(sn.attributes.name) === "yandex-verification" || lowerIfExists(sn.attributes.name) === "csrf-token" || lowerIfExists(sn.attributes.name) === "p:domain_verify" || lowerIfExists(sn.attributes.name) === "verify-v1" || lowerIfExists(sn.attributes.name) === "verification" || lowerIfExists(sn.attributes.name) === "shopify-checkout-api-token")) {
        return true;
      }
    }
  }
  return false;
}
function serializeNodeWithId(n2, options) {
  const {
    doc,
    mirror: mirror2,
    blockClass,
    blockSelector,
    unblockSelector,
    maskAllText,
    maskTextClass,
    unmaskTextClass,
    maskTextSelector,
    unmaskTextSelector,
    skipChild = false,
    inlineStylesheet = true,
    maskInputOptions = {},
    maskAttributeFn,
    maskTextFn,
    maskInputFn,
    slimDOMOptions,
    dataURLOptions = {},
    inlineImages = false,
    recordCanvas = false,
    onSerialize,
    onIframeLoad,
    iframeLoadTimeout = 5e3,
    onBlockedImageLoad,
    onStylesheetLoad,
    stylesheetLoadTimeout = 5e3,
    keepIframeSrcFn = () => false,
    newlyAddedElement = false,
    ignoreCSSAttributes
  } = options;
  let { preserveWhiteSpace = true } = options;
  const _serializedNode = serializeNode(n2, {
    doc,
    mirror: mirror2,
    blockClass,
    blockSelector,
    maskAllText,
    unblockSelector,
    maskTextClass,
    unmaskTextClass,
    maskTextSelector,
    unmaskTextSelector,
    inlineStylesheet,
    maskInputOptions,
    maskAttributeFn,
    maskTextFn,
    maskInputFn,
    dataURLOptions,
    inlineImages,
    recordCanvas,
    keepIframeSrcFn,
    newlyAddedElement,
    ignoreCSSAttributes
  });
  if (!_serializedNode) {
    console.warn(n2, "not serialized");
    return null;
  }
  let id;
  if (mirror2.hasNode(n2)) {
    id = mirror2.getId(n2);
  } else if (slimDOMExcluded(_serializedNode, slimDOMOptions) || !preserveWhiteSpace && _serializedNode.type === NodeType$1.Text && !_serializedNode.isStyle && !_serializedNode.textContent.trim().length) {
    id = IGNORED_NODE;
  } else {
    id = genId();
  }
  const serializedNode2 = Object.assign(_serializedNode, { id });
  mirror2.add(n2, serializedNode2);
  if (id === IGNORED_NODE) {
    return null;
  }
  if (onSerialize) {
    onSerialize(n2);
  }
  let recordChild = !skipChild;
  if (serializedNode2.type === NodeType$1.Element) {
    recordChild = recordChild && !serializedNode2.needBlock;
    const shadowRoot = n2.shadowRoot;
    if (shadowRoot && isNativeShadowDom(shadowRoot))
      serializedNode2.isShadowHost = true;
  }
  if ((serializedNode2.type === NodeType$1.Document || serializedNode2.type === NodeType$1.Element) && recordChild) {
    if (slimDOMOptions.headWhitespace && serializedNode2.type === NodeType$1.Element && serializedNode2.tagName === "head") {
      preserveWhiteSpace = false;
    }
    const bypassOptions = {
      doc,
      mirror: mirror2,
      blockClass,
      blockSelector,
      maskAllText,
      unblockSelector,
      maskTextClass,
      unmaskTextClass,
      maskTextSelector,
      unmaskTextSelector,
      skipChild,
      inlineStylesheet,
      maskInputOptions,
      maskAttributeFn,
      maskTextFn,
      maskInputFn,
      slimDOMOptions,
      dataURLOptions,
      inlineImages,
      recordCanvas,
      preserveWhiteSpace,
      onSerialize,
      onIframeLoad,
      iframeLoadTimeout,
      onBlockedImageLoad,
      onStylesheetLoad,
      stylesheetLoadTimeout,
      keepIframeSrcFn,
      ignoreCSSAttributes
    };
    const childNodes = n2.childNodes ? Array.from(n2.childNodes) : [];
    for (const childN of childNodes) {
      const serializedChildNode = serializeNodeWithId(childN, bypassOptions);
      if (serializedChildNode) {
        serializedNode2.childNodes.push(serializedChildNode);
      }
    }
    if (isElement$1(n2) && n2.shadowRoot) {
      for (const childN of Array.from(n2.shadowRoot.childNodes)) {
        const serializedChildNode = serializeNodeWithId(childN, bypassOptions);
        if (serializedChildNode) {
          isNativeShadowDom(n2.shadowRoot) && (serializedChildNode.isShadow = true);
          serializedNode2.childNodes.push(serializedChildNode);
        }
      }
    }
  }
  if (n2.parentNode && isShadowRoot(n2.parentNode) && isNativeShadowDom(n2.parentNode)) {
    serializedNode2.isShadow = true;
  }
  if (serializedNode2.type === NodeType$1.Element && serializedNode2.tagName === "iframe" && !serializedNode2.needBlock) {
    onceIframeLoaded(
      n2,
      () => {
        const iframeDoc = getIFrameContentDocument$1(n2);
        if (iframeDoc && onIframeLoad) {
          const serializedIframeNode = serializeNodeWithId(iframeDoc, {
            doc: iframeDoc,
            mirror: mirror2,
            blockClass,
            blockSelector,
            unblockSelector,
            maskAllText,
            maskTextClass,
            unmaskTextClass,
            maskTextSelector,
            unmaskTextSelector,
            skipChild: false,
            inlineStylesheet,
            maskInputOptions,
            maskAttributeFn,
            maskTextFn,
            maskInputFn,
            slimDOMOptions,
            dataURLOptions,
            inlineImages,
            recordCanvas,
            preserveWhiteSpace,
            onSerialize,
            onIframeLoad,
            iframeLoadTimeout,
            onStylesheetLoad,
            stylesheetLoadTimeout,
            keepIframeSrcFn,
            ignoreCSSAttributes
          });
          if (serializedIframeNode) {
            onIframeLoad(
              n2,
              serializedIframeNode
            );
          }
        }
      },
      iframeLoadTimeout
    );
  }
  if (serializedNode2.type === NodeType$1.Element && serializedNode2.tagName === "img" && !n2.complete && serializedNode2.needBlock) {
    const image = n2;
    const updateImageDimensions = () => {
      if (image.isConnected && !image.complete && onBlockedImageLoad) {
        try {
          const rect = image.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            onBlockedImageLoad(image, serializedNode2, rect);
          }
        } catch (error2) {
        }
      }
      image.removeEventListener("load", updateImageDimensions);
    };
    if (image.isConnected) {
      image.addEventListener("load", updateImageDimensions);
    }
  }
  if (serializedNode2.type === NodeType$1.Element && serializedNode2.tagName === "link" && typeof serializedNode2.attributes.rel === "string" && (serializedNode2.attributes.rel === "stylesheet" || serializedNode2.attributes.rel === "preload" && typeof serializedNode2.attributes.href === "string" && extractFileExtension(serializedNode2.attributes.href) === "css")) {
    onceStylesheetLoaded(
      n2,
      () => {
        if (onStylesheetLoad) {
          const serializedLinkNode = serializeNodeWithId(n2, {
            doc,
            mirror: mirror2,
            blockClass,
            blockSelector,
            unblockSelector,
            maskAllText,
            maskTextClass,
            unmaskTextClass,
            maskTextSelector,
            unmaskTextSelector,
            skipChild: false,
            inlineStylesheet,
            maskInputOptions,
            maskAttributeFn,
            maskTextFn,
            maskInputFn,
            slimDOMOptions,
            dataURLOptions,
            inlineImages,
            recordCanvas,
            preserveWhiteSpace,
            onSerialize,
            onIframeLoad,
            iframeLoadTimeout,
            onStylesheetLoad,
            stylesheetLoadTimeout,
            keepIframeSrcFn,
            ignoreCSSAttributes
          });
          if (serializedLinkNode) {
            onStylesheetLoad(
              n2,
              serializedLinkNode
            );
          }
        }
      },
      stylesheetLoadTimeout
    );
  }
  if (serializedNode2.type === NodeType$1.Element) {
    delete serializedNode2.needBlock;
  }
  return serializedNode2;
}
function snapshot(n2, options) {
  const {
    mirror: mirror2 = new Mirror$1(),
    blockClass = "rr-block",
    blockSelector = null,
    unblockSelector = null,
    maskAllText = false,
    maskTextClass = "rr-mask",
    unmaskTextClass = null,
    maskTextSelector = null,
    unmaskTextSelector = null,
    inlineStylesheet = true,
    inlineImages = false,
    recordCanvas = false,
    maskAllInputs = false,
    maskAttributeFn,
    maskTextFn,
    maskInputFn,
    slimDOM = false,
    dataURLOptions,
    preserveWhiteSpace,
    onSerialize,
    onIframeLoad,
    iframeLoadTimeout,
    onBlockedImageLoad,
    onStylesheetLoad,
    stylesheetLoadTimeout,
    keepIframeSrcFn = () => false,
    ignoreCSSAttributes = /* @__PURE__ */ new Set([])
  } = options || {};
  const maskInputOptions = maskAllInputs === true ? {
    color: true,
    date: true,
    "datetime-local": true,
    email: true,
    month: true,
    number: true,
    range: true,
    search: true,
    tel: true,
    text: true,
    time: true,
    url: true,
    week: true,
    textarea: true,
    select: true
  } : maskAllInputs === false ? {} : maskAllInputs;
  const slimDOMOptions = slimDOM === true || slimDOM === "all" ? (
    // if true: set of sensible options that should not throw away any information
    {
      script: true,
      comment: true,
      headFavicon: true,
      headWhitespace: true,
      headMetaDescKeywords: slimDOM === "all",
      // destructive
      headMetaSocial: true,
      headMetaRobots: true,
      headMetaHttpEquiv: true,
      headMetaAuthorship: true,
      headMetaVerification: true
    }
  ) : slimDOM === false ? {} : slimDOM;
  return serializeNodeWithId(n2, {
    doc: n2,
    mirror: mirror2,
    blockClass,
    blockSelector,
    unblockSelector,
    maskAllText,
    maskTextClass,
    unmaskTextClass,
    maskTextSelector,
    unmaskTextSelector,
    skipChild: false,
    inlineStylesheet,
    maskInputOptions,
    maskAttributeFn,
    maskTextFn,
    maskInputFn,
    slimDOMOptions,
    dataURLOptions,
    inlineImages,
    recordCanvas,
    preserveWhiteSpace,
    onSerialize,
    onIframeLoad,
    iframeLoadTimeout,
    onBlockedImageLoad,
    onStylesheetLoad,
    stylesheetLoadTimeout,
    keepIframeSrcFn,
    newlyAddedElement: false,
    ignoreCSSAttributes
  });
}
function on(type, fn, target = document) {
  const options = { capture: true, passive: true };
  target.addEventListener(type, fn, options);
  return () => target.removeEventListener(type, fn, options);
}
const DEPARTED_MIRROR_ACCESS_WARNING$1 = "Please stop import mirror directly. Instead of that,\r\nnow you can use replayer.getMirror() to access the mirror instance of a replayer,\r\nor you can use record.mirror to access the mirror instance during recording.";
let _mirror$1 = {
  map: {},
  getId() {
    console.error(DEPARTED_MIRROR_ACCESS_WARNING$1);
    return -1;
  },
  getNode() {
    console.error(DEPARTED_MIRROR_ACCESS_WARNING$1);
    return null;
  },
  removeNodeFromMap() {
    console.error(DEPARTED_MIRROR_ACCESS_WARNING$1);
  },
  has() {
    console.error(DEPARTED_MIRROR_ACCESS_WARNING$1);
    return false;
  },
  reset() {
    console.error(DEPARTED_MIRROR_ACCESS_WARNING$1);
  }
};
if (typeof window !== "undefined" && window.Proxy && window.Reflect) {
  _mirror$1 = new Proxy(_mirror$1, {
    get(target, prop, receiver) {
      if (prop === "map") {
        console.error(DEPARTED_MIRROR_ACCESS_WARNING$1);
      }
      return Reflect.get(target, prop, receiver);
    }
  });
}
function throttle$1(func, wait, options = {}) {
  let timeout = null;
  let previous = 0;
  return function(...args) {
    const now = Date.now();
    if (!previous && options.leading === false) {
      previous = now;
    }
    const remaining = wait - (now - previous);
    const context = this;
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout$2(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(context, args);
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout$2(() => {
        previous = options.leading === false ? 0 : Date.now();
        timeout = null;
        func.apply(context, args);
      }, remaining);
    }
  };
}
function hookSetter$1(target, key, d2, isRevoked, win = window) {
  const original = win.Object.getOwnPropertyDescriptor(target, key);
  win.Object.defineProperty(
    target,
    key,
    isRevoked ? d2 : {
      set(value) {
        setTimeout$2(() => {
          d2.set.call(this, value);
        }, 0);
        if (original && original.set) {
          original.set.call(this, value);
        }
      }
    }
  );
  return () => hookSetter$1(target, key, original || {}, true);
}
function patch$1(source, name, replacement) {
  try {
    if (!(name in source)) {
      return () => {
      };
    }
    const original = source[name];
    const wrapped = replacement(original);
    if (typeof wrapped === "function") {
      wrapped.prototype = wrapped.prototype || {};
      Object.defineProperties(wrapped, {
        __rrweb_original__: {
          enumerable: false,
          value: original
        }
      });
    }
    source[name] = wrapped;
    return () => {
      source[name] = original;
    };
  } catch {
    return () => {
    };
  }
}
let nowTimestamp = Date.now;
if (!/* @__PURE__ */ /[1-9][0-9]{12}/.test(Date.now().toString())) {
  nowTimestamp = () => (/* @__PURE__ */ new Date()).getTime();
}
function getWindowScroll(win) {
  const doc = win.document;
  return {
    left: doc.scrollingElement ? doc.scrollingElement.scrollLeft : win.pageXOffset !== void 0 ? win.pageXOffset : doc?.documentElement.scrollLeft || doc?.body?.parentElement?.scrollLeft || doc?.body?.scrollLeft || 0,
    top: doc.scrollingElement ? doc.scrollingElement.scrollTop : win.pageYOffset !== void 0 ? win.pageYOffset : doc?.documentElement.scrollTop || doc?.body?.parentElement?.scrollTop || doc?.body?.scrollTop || 0
  };
}
function getWindowHeight() {
  return window.innerHeight || document.documentElement && document.documentElement.clientHeight || document.body && document.body.clientHeight;
}
function getWindowWidth() {
  return window.innerWidth || document.documentElement && document.documentElement.clientWidth || document.body && document.body.clientWidth;
}
function closestElementOfNode$1(node) {
  if (!node) {
    return null;
  }
  try {
    const el = node.nodeType === node.ELEMENT_NODE ? node : node.parentElement;
    return el;
  } catch (error2) {
    return null;
  }
}
function isBlocked$1(node, blockClass, blockSelector, unblockSelector, checkAncestors) {
  if (!node) {
    return false;
  }
  const el = closestElementOfNode$1(node);
  if (!el) {
    return false;
  }
  const blockedPredicate = createMatchPredicate$1(blockClass, blockSelector);
  if (!checkAncestors) {
    const isUnblocked = unblockSelector && el.matches(unblockSelector);
    return blockedPredicate(el) && !isUnblocked;
  }
  const blockDistance = distanceToMatch$1(el, blockedPredicate);
  let unblockDistance = -1;
  if (blockDistance < 0) {
    return false;
  }
  if (unblockSelector) {
    unblockDistance = distanceToMatch$1(
      el,
      createMatchPredicate$1(null, unblockSelector)
    );
  }
  if (blockDistance > -1 && unblockDistance < 0) {
    return true;
  }
  return blockDistance < unblockDistance;
}
function isSerialized(n2, mirror2) {
  return mirror2.getId(n2) !== -1;
}
function isIgnored(n2, mirror2) {
  return mirror2.getId(n2) === IGNORED_NODE;
}
function isAncestorRemoved(target, mirror2) {
  if (isShadowRoot(target)) {
    return false;
  }
  const id = mirror2.getId(target);
  if (!mirror2.has(id)) {
    return true;
  }
  if (target.parentNode && target.parentNode.nodeType === target.DOCUMENT_NODE) {
    return false;
  }
  if (!target.parentNode) {
    return true;
  }
  return isAncestorRemoved(target.parentNode, mirror2);
}
function legacy_isTouchEvent(event) {
  return Boolean(event.changedTouches);
}
function polyfill(win = window) {
  if ("NodeList" in win && !win.NodeList.prototype.forEach) {
    win.NodeList.prototype.forEach = Array.prototype.forEach;
  }
  if ("DOMTokenList" in win && !win.DOMTokenList.prototype.forEach) {
    win.DOMTokenList.prototype.forEach = Array.prototype.forEach;
  }
  if (!Node.prototype.contains) {
    Node.prototype.contains = (...args) => {
      let node = args[0];
      if (!(0 in args)) {
        throw new TypeError("1 argument is required");
      }
      do {
        if (this === node) {
          return true;
        }
      } while (node = node && node.parentNode);
      return false;
    };
  }
}
function isSerializedIframe(n2, mirror2) {
  return Boolean(n2.nodeName === "IFRAME" && mirror2.getMeta(n2));
}
function isSerializedStylesheet(n2, mirror2) {
  return Boolean(
    n2.nodeName === "LINK" && n2.nodeType === n2.ELEMENT_NODE && n2.getAttribute && n2.getAttribute("rel") === "stylesheet" && mirror2.getMeta(n2)
  );
}
function hasShadowRoot(n2) {
  return Boolean(n2?.shadowRoot);
}
class StyleSheetMirror {
  constructor() {
    this.id = 1;
    this.styleIDMap = /* @__PURE__ */ new WeakMap();
    this.idStyleMap = /* @__PURE__ */ new Map();
  }
  getId(stylesheet) {
    return this.styleIDMap.get(stylesheet) ?? -1;
  }
  has(stylesheet) {
    return this.styleIDMap.has(stylesheet);
  }
  /**
   * @returns If the stylesheet is in the mirror, returns the id of the stylesheet. If not, return the new assigned id.
   */
  add(stylesheet, id) {
    if (this.has(stylesheet)) return this.getId(stylesheet);
    let newId;
    if (id === void 0) {
      newId = this.id++;
    } else newId = id;
    this.styleIDMap.set(stylesheet, newId);
    this.idStyleMap.set(newId, stylesheet);
    return newId;
  }
  getStyle(id) {
    return this.idStyleMap.get(id) || null;
  }
  reset() {
    this.styleIDMap = /* @__PURE__ */ new WeakMap();
    this.idStyleMap = /* @__PURE__ */ new Map();
    this.id = 1;
  }
  generateId() {
    return this.id++;
  }
}
function getShadowHost(n2) {
  let shadowHost = null;
  if (n2.getRootNode?.()?.nodeType === Node.DOCUMENT_FRAGMENT_NODE && n2.getRootNode().host)
    shadowHost = n2.getRootNode().host;
  return shadowHost;
}
function getRootShadowHost(n2) {
  let rootShadowHost = n2;
  let shadowHost;
  while (shadowHost = getShadowHost(rootShadowHost))
    rootShadowHost = shadowHost;
  return rootShadowHost;
}
function shadowHostInDom(n2) {
  const doc = n2.ownerDocument;
  if (!doc) return false;
  const shadowHost = getRootShadowHost(n2);
  return doc.contains(shadowHost);
}
function inDom(n2) {
  const doc = n2.ownerDocument;
  if (!doc) return false;
  return doc.contains(n2) || shadowHostInDom(n2);
}
const cachedImplementations$2 = {};
function getImplementation$2(name) {
  const cached = cachedImplementations$2[name];
  if (cached) {
    return cached;
  }
  const document2 = window.document;
  let impl = window[name];
  if (document2 && typeof document2.createElement === "function") {
    try {
      const sandbox = document2.createElement("iframe");
      sandbox.hidden = true;
      document2.head.appendChild(sandbox);
      const contentWindow = sandbox.contentWindow;
      if (contentWindow && contentWindow[name]) {
        impl = // eslint-disable-next-line @typescript-eslint/unbound-method
        contentWindow[name];
      }
      document2.head.removeChild(sandbox);
    } catch (e2) {
    }
  }
  return cachedImplementations$2[name] = impl.bind(
    window
  );
}
function onRequestAnimationFrame$1(...rest) {
  return getImplementation$2("requestAnimationFrame")(...rest);
}
function setTimeout$2(...rest) {
  return getImplementation$2("setTimeout")(...rest);
}
function clearTimeout$2(...rest) {
  return getImplementation$2("clearTimeout")(...rest);
}
var EventType = /* @__PURE__ */ ((EventType2) => {
  EventType2[EventType2["DomContentLoaded"] = 0] = "DomContentLoaded";
  EventType2[EventType2["Load"] = 1] = "Load";
  EventType2[EventType2["FullSnapshot"] = 2] = "FullSnapshot";
  EventType2[EventType2["IncrementalSnapshot"] = 3] = "IncrementalSnapshot";
  EventType2[EventType2["Meta"] = 4] = "Meta";
  EventType2[EventType2["Custom"] = 5] = "Custom";
  EventType2[EventType2["Plugin"] = 6] = "Plugin";
  return EventType2;
})(EventType || {});
var IncrementalSource = /* @__PURE__ */ ((IncrementalSource2) => {
  IncrementalSource2[IncrementalSource2["Mutation"] = 0] = "Mutation";
  IncrementalSource2[IncrementalSource2["MouseMove"] = 1] = "MouseMove";
  IncrementalSource2[IncrementalSource2["MouseInteraction"] = 2] = "MouseInteraction";
  IncrementalSource2[IncrementalSource2["Scroll"] = 3] = "Scroll";
  IncrementalSource2[IncrementalSource2["ViewportResize"] = 4] = "ViewportResize";
  IncrementalSource2[IncrementalSource2["Input"] = 5] = "Input";
  IncrementalSource2[IncrementalSource2["TouchMove"] = 6] = "TouchMove";
  IncrementalSource2[IncrementalSource2["MediaInteraction"] = 7] = "MediaInteraction";
  IncrementalSource2[IncrementalSource2["StyleSheetRule"] = 8] = "StyleSheetRule";
  IncrementalSource2[IncrementalSource2["CanvasMutation"] = 9] = "CanvasMutation";
  IncrementalSource2[IncrementalSource2["Font"] = 10] = "Font";
  IncrementalSource2[IncrementalSource2["Log"] = 11] = "Log";
  IncrementalSource2[IncrementalSource2["Drag"] = 12] = "Drag";
  IncrementalSource2[IncrementalSource2["StyleDeclaration"] = 13] = "StyleDeclaration";
  IncrementalSource2[IncrementalSource2["Selection"] = 14] = "Selection";
  IncrementalSource2[IncrementalSource2["AdoptedStyleSheet"] = 15] = "AdoptedStyleSheet";
  IncrementalSource2[IncrementalSource2["CustomElement"] = 16] = "CustomElement";
  return IncrementalSource2;
})(IncrementalSource || {});
var MouseInteractions = /* @__PURE__ */ ((MouseInteractions2) => {
  MouseInteractions2[MouseInteractions2["MouseUp"] = 0] = "MouseUp";
  MouseInteractions2[MouseInteractions2["MouseDown"] = 1] = "MouseDown";
  MouseInteractions2[MouseInteractions2["Click"] = 2] = "Click";
  MouseInteractions2[MouseInteractions2["ContextMenu"] = 3] = "ContextMenu";
  MouseInteractions2[MouseInteractions2["DblClick"] = 4] = "DblClick";
  MouseInteractions2[MouseInteractions2["Focus"] = 5] = "Focus";
  MouseInteractions2[MouseInteractions2["Blur"] = 6] = "Blur";
  MouseInteractions2[MouseInteractions2["TouchStart"] = 7] = "TouchStart";
  MouseInteractions2[MouseInteractions2["TouchMove_Departed"] = 8] = "TouchMove_Departed";
  MouseInteractions2[MouseInteractions2["TouchEnd"] = 9] = "TouchEnd";
  MouseInteractions2[MouseInteractions2["TouchCancel"] = 10] = "TouchCancel";
  return MouseInteractions2;
})(MouseInteractions || {});
var PointerTypes = /* @__PURE__ */ ((PointerTypes2) => {
  PointerTypes2[PointerTypes2["Mouse"] = 0] = "Mouse";
  PointerTypes2[PointerTypes2["Pen"] = 1] = "Pen";
  PointerTypes2[PointerTypes2["Touch"] = 2] = "Touch";
  return PointerTypes2;
})(PointerTypes || {});
var MediaInteractions = /* @__PURE__ */ ((MediaInteractions2) => {
  MediaInteractions2[MediaInteractions2["Play"] = 0] = "Play";
  MediaInteractions2[MediaInteractions2["Pause"] = 1] = "Pause";
  MediaInteractions2[MediaInteractions2["Seeked"] = 2] = "Seeked";
  MediaInteractions2[MediaInteractions2["VolumeChange"] = 3] = "VolumeChange";
  MediaInteractions2[MediaInteractions2["RateChange"] = 4] = "RateChange";
  return MediaInteractions2;
})(MediaInteractions || {});
let errorHandler$1;
function registerErrorHandler$1(handler) {
  errorHandler$1 = handler;
}
function unregisterErrorHandler() {
  errorHandler$1 = void 0;
}
const callbackWrapper$1 = (cb) => {
  if (!errorHandler$1) {
    return cb;
  }
  const rrwebWrapped = ((...rest) => {
    try {
      return cb(...rest);
    } catch (error2) {
      if (errorHandler$1 && errorHandler$1(error2) === true) {
        return () => {
        };
      }
      throw error2;
    }
  });
  return rrwebWrapped;
};
var chars$1 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var lookup$1 = typeof Uint8Array === "undefined" ? [] : new Uint8Array(256);
for (var i$1 = 0; i$1 < chars$1.length; i$1++) {
  lookup$1[chars$1.charCodeAt(i$1)] = i$1;
}
class CanvasManagerNoop {
  reset() {
  }
  freeze() {
  }
  unfreeze() {
  }
  lock() {
  }
  unlock() {
  }
  snapshot() {
  }
  addWindow() {
  }
  addShadowRoot() {
  }
  resetShadowRoots() {
  }
}
function getIFrameContentDocument(iframe) {
  try {
    return iframe.contentDocument;
  } catch (e2) {
  }
}
function getIFrameContentWindow(iframe) {
  try {
    return iframe.contentWindow;
  } catch (e2) {
  }
}
class StyleDeclarationParser {
  constructor(doc) {
    this.doc = doc;
    this.unattachedDoc = null;
  }
  parse(styleText) {
    return this.parseWithConstructableStylesheet(styleText) || this.parseWithDetachedElement(styleText);
  }
  parseWithConstructableStylesheet(styleText) {
    if (typeof CSSStyleSheet === "undefined" || typeof CSSStyleSheet.prototype.replaceSync !== "function") {
      return null;
    }
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(`x { ${styleText} }`);
      const rule = sheet.cssRules[0];
      if (!rule || rule.type !== CSSRule.STYLE_RULE) {
        return null;
      }
      return rule.style;
    } catch {
      return null;
    }
  }
  parseWithDetachedElement(styleText) {
    const old = this.getUnattachedDoc().createElement("span");
    old.setAttribute("style", styleText);
    return old.style;
  }
  getUnattachedDoc() {
    if (!this.unattachedDoc) {
      try {
        this.unattachedDoc = document.implementation.createHTMLDocument();
      } catch {
        this.unattachedDoc = this.doc;
      }
    }
    return this.unattachedDoc;
  }
}
function isNodeInLinkedList(n2) {
  return "__ln" in n2;
}
class DoubleLinkedList {
  constructor() {
    this.length = 0;
    this.head = null;
    this.tail = null;
  }
  get(position) {
    if (position >= this.length) {
      throw new Error("Position outside of list range");
    }
    let current = this.head;
    for (let index = 0; index < position; index++) {
      current = current?.next || null;
    }
    return current;
  }
  addNode(n2) {
    const node = {
      value: n2,
      previous: null,
      next: null
    };
    n2.__ln = node;
    if (n2.previousSibling && isNodeInLinkedList(n2.previousSibling)) {
      const current = n2.previousSibling.__ln.next;
      node.next = current;
      node.previous = n2.previousSibling.__ln;
      n2.previousSibling.__ln.next = node;
      if (current) {
        current.previous = node;
      }
    } else if (n2.nextSibling && isNodeInLinkedList(n2.nextSibling) && n2.nextSibling.__ln.previous) {
      const current = n2.nextSibling.__ln.previous;
      node.previous = current;
      node.next = n2.nextSibling.__ln;
      n2.nextSibling.__ln.previous = node;
      if (current) {
        current.next = node;
      }
    } else {
      if (this.head) {
        this.head.previous = node;
      }
      node.next = this.head;
      this.head = node;
    }
    if (node.next === null) {
      this.tail = node;
    }
    this.length++;
  }
  removeNode(n2) {
    const current = n2.__ln;
    if (!this.head) {
      return;
    }
    if (!current.previous) {
      this.head = current.next;
      if (this.head) {
        this.head.previous = null;
      } else {
        this.tail = null;
      }
    } else {
      current.previous.next = current.next;
      if (current.next) {
        current.next.previous = current.previous;
      } else {
        this.tail = current.previous;
      }
    }
    if (n2.__ln) {
      delete n2.__ln;
    }
    this.length--;
  }
}
const moveKey = (id, parentId) => `${id}@${parentId}`;
class MutationBuffer {
  constructor() {
    this.frozen = false;
    this.locked = false;
    this.texts = [];
    this.attributes = [];
    this.attributeMap = /* @__PURE__ */ new WeakMap();
    this.removes = [];
    this.mapRemoves = [];
    this.movedMap = {};
    this.addedSet = /* @__PURE__ */ new Set();
    this.movedSet = /* @__PURE__ */ new Set();
    this.droppedSet = /* @__PURE__ */ new Set();
    this.processMutations = (mutations) => {
      mutations.forEach(this.processMutation);
      this.emit();
    };
    this.emit = () => {
      if (this.frozen || this.locked) {
        return;
      }
      const adds = [];
      const addedIds = /* @__PURE__ */ new Set();
      const addList = new DoubleLinkedList();
      const getNextId = (n2) => {
        let ns = n2;
        let nextId = IGNORED_NODE;
        while (nextId === IGNORED_NODE) {
          ns = ns && ns.nextSibling;
          nextId = ns && this.mirror.getId(ns);
        }
        return nextId;
      };
      const pushAdd = (n2) => {
        if (!n2.parentNode || !inDom(n2)) {
          return;
        }
        const parentId = isShadowRoot(n2.parentNode) ? this.mirror.getId(getShadowHost(n2)) : this.mirror.getId(n2.parentNode);
        const nextId = getNextId(n2);
        if (parentId === -1 || nextId === -1) {
          return addList.addNode(n2);
        }
        const sn = serializeNodeWithId(n2, {
          doc: this.doc,
          mirror: this.mirror,
          blockClass: this.blockClass,
          blockSelector: this.blockSelector,
          maskAllText: this.maskAllText,
          unblockSelector: this.unblockSelector,
          maskTextClass: this.maskTextClass,
          unmaskTextClass: this.unmaskTextClass,
          maskTextSelector: this.maskTextSelector,
          unmaskTextSelector: this.unmaskTextSelector,
          skipChild: true,
          newlyAddedElement: true,
          inlineStylesheet: this.inlineStylesheet,
          maskInputOptions: this.maskInputOptions,
          maskAttributeFn: this.maskAttributeFn,
          maskTextFn: this.maskTextFn,
          maskInputFn: this.maskInputFn,
          slimDOMOptions: this.slimDOMOptions,
          dataURLOptions: this.dataURLOptions,
          recordCanvas: this.recordCanvas,
          inlineImages: this.inlineImages,
          onSerialize: (currentN) => {
            if (isSerializedIframe(currentN, this.mirror) && !isBlocked$1(
              currentN,
              this.blockClass,
              this.blockSelector,
              this.unblockSelector,
              false
            )) {
              this.iframeManager.addIframe(currentN);
            }
            if (isSerializedStylesheet(currentN, this.mirror)) {
              this.stylesheetManager.trackLinkElement(
                currentN
              );
            }
            if (hasShadowRoot(n2)) {
              this.shadowDomManager.addShadowRoot(n2.shadowRoot, this.doc);
            }
          },
          onIframeLoad: (iframe, childSn) => {
            if (isBlocked$1(
              iframe,
              this.blockClass,
              this.blockSelector,
              this.unblockSelector,
              false
            )) {
              return;
            }
            this.iframeManager.attachIframe(iframe, childSn);
            const contentWindow = getIFrameContentWindow(iframe);
            if (contentWindow) {
              this.canvasManager.addWindow(contentWindow);
            }
            this.shadowDomManager.observeAttachShadow(iframe);
          },
          onStylesheetLoad: (link, childSn) => {
            this.stylesheetManager.attachLinkElement(link, childSn);
          },
          onBlockedImageLoad: (_imageEl, serializedNode, { width, height }) => {
            this.mutationCb({
              adds: [],
              removes: [],
              texts: [],
              attributes: [
                {
                  id: serializedNode.id,
                  attributes: {
                    style: {
                      width: `${width}px`,
                      height: `${height}px`
                    }
                  }
                }
              ]
            });
          },
          ignoreCSSAttributes: this.ignoreCSSAttributes
        });
        if (sn) {
          adds.push({
            parentId,
            nextId,
            node: sn
          });
          addedIds.add(sn.id);
        }
      };
      while (this.mapRemoves.length) {
        this.mirror.removeNodeFromMap(this.mapRemoves.shift());
      }
      for (const n2 of this.movedSet) {
        if (isParentRemoved(this.removes, n2, this.mirror) && !this.movedSet.has(n2.parentNode)) {
          continue;
        }
        pushAdd(n2);
      }
      for (const n2 of this.addedSet) {
        if (!isAncestorInSet(this.droppedSet, n2) && !isParentRemoved(this.removes, n2, this.mirror)) {
          pushAdd(n2);
        } else if (isAncestorInSet(this.movedSet, n2)) {
          pushAdd(n2);
        } else {
          this.droppedSet.add(n2);
        }
      }
      let candidate = null;
      while (addList.length) {
        let node = null;
        if (candidate) {
          const parentId = this.mirror.getId(candidate.value.parentNode);
          const nextId = getNextId(candidate.value);
          if (parentId !== -1 && nextId !== -1) {
            node = candidate;
          }
        }
        if (!node) {
          let tailNode = addList.tail;
          while (tailNode) {
            const _node = tailNode;
            tailNode = tailNode.previous;
            if (_node) {
              const parentId = this.mirror.getId(_node.value.parentNode);
              const nextId = getNextId(_node.value);
              if (nextId === -1) continue;
              else if (parentId !== -1) {
                node = _node;
                break;
              } else {
                const unhandledNode = _node.value;
                if (unhandledNode.parentNode && unhandledNode.parentNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                  const shadowHost = unhandledNode.parentNode.host;
                  const parentId2 = this.mirror.getId(shadowHost);
                  if (parentId2 !== -1) {
                    node = _node;
                    break;
                  }
                }
              }
            }
          }
        }
        if (!node) {
          while (addList.head) {
            addList.removeNode(addList.head.value);
          }
          break;
        }
        candidate = node.previous;
        addList.removeNode(node.value);
        pushAdd(node.value);
      }
      const payload = {
        texts: this.texts.map((text) => ({
          id: this.mirror.getId(text.node),
          value: text.value
        })).filter((text) => !addedIds.has(text.id)).filter((text) => this.mirror.has(text.id)),
        attributes: this.attributes.map((attribute) => {
          const { attributes } = attribute;
          if (typeof attributes.style === "string") {
            const diffAsStr = JSON.stringify(attribute.styleDiff);
            const unchangedAsStr = JSON.stringify(attribute._unchangedStyles);
            if (diffAsStr.length < attributes.style.length) {
              if ((diffAsStr + unchangedAsStr).split("var(").length === attributes.style.split("var(").length) {
                attributes.style = attribute.styleDiff;
              }
            }
          }
          return {
            id: this.mirror.getId(attribute.node),
            attributes
          };
        }).filter((attribute) => !addedIds.has(attribute.id)).filter((attribute) => this.mirror.has(attribute.id)),
        removes: this.removes,
        adds
      };
      if (!payload.texts.length && !payload.attributes.length && !payload.removes.length && !payload.adds.length) {
        return;
      }
      this.texts = [];
      this.attributes = [];
      this.attributeMap = /* @__PURE__ */ new WeakMap();
      this.removes = [];
      this.addedSet = /* @__PURE__ */ new Set();
      this.movedSet = /* @__PURE__ */ new Set();
      this.droppedSet = /* @__PURE__ */ new Set();
      this.movedMap = {};
      this.mutationCb(payload);
    };
    this.processMutation = (m2) => {
      if (isIgnored(m2.target, this.mirror)) {
        return;
      }
      switch (m2.type) {
        case "characterData": {
          const value = m2.target.textContent;
          if (!isBlocked$1(
            m2.target,
            this.blockClass,
            this.blockSelector,
            this.unblockSelector,
            false
          ) && value !== m2.oldValue) {
            this.texts.push({
              value: needMaskingText(
                m2.target,
                this.maskTextClass,
                this.maskTextSelector,
                this.unmaskTextClass,
                this.unmaskTextSelector,
                this.maskAllText
              ) && value ? this.maskTextFn ? this.maskTextFn(value, closestElementOfNode$1(m2.target)) : value.replace(/[\S]/g, "*") : value,
              node: m2.target
            });
          }
          break;
        }
        case "attributes": {
          const target = m2.target;
          let attributeName = m2.attributeName;
          let value = m2.target.getAttribute(attributeName);
          if (attributeName === "value") {
            const type = getInputType(target);
            const tagName = target.tagName;
            value = getInputValue(target, tagName, type);
            const isInputMasked = shouldMaskInput({
              maskInputOptions: this.maskInputOptions,
              tagName,
              type
            });
            const forceMask = needMaskingText(
              m2.target,
              this.maskTextClass,
              this.maskTextSelector,
              this.unmaskTextClass,
              this.unmaskTextSelector,
              isInputMasked
            );
            value = maskInputValue({
              isMasked: forceMask,
              element: target,
              value,
              maskInputFn: this.maskInputFn
            });
          }
          if (isBlocked$1(
            m2.target,
            this.blockClass,
            this.blockSelector,
            this.unblockSelector,
            false
          ) || value === m2.oldValue) {
            return;
          }
          let item = this.attributeMap.get(m2.target);
          if (target.tagName === "IFRAME" && attributeName === "src" && !this.keepIframeSrcFn(value)) {
            const iframeDoc = getIFrameContentDocument(
              target
            );
            if (!iframeDoc) {
              attributeName = "rr_src";
            } else {
              return;
            }
          }
          if (!item) {
            item = {
              node: m2.target,
              attributes: {},
              styleDiff: {},
              _unchangedStyles: {}
            };
            this.attributes.push(item);
            this.attributeMap.set(m2.target, item);
          }
          if (attributeName === "type" && target.tagName === "INPUT" && (m2.oldValue || "").toLowerCase() === "password") {
            target.setAttribute("data-rr-is-password", "true");
          }
          if (!ignoreAttribute(target.tagName, attributeName)) {
            item.attributes[attributeName] = transformAttribute(
              this.doc,
              toLowerCase(target.tagName),
              toLowerCase(attributeName),
              value,
              target,
              this.maskAttributeFn
            );
            if (attributeName === "style") {
              const oldStyle = m2.oldValue ? this.styleDeclarationParser.parse(m2.oldValue) : null;
              for (const pname of Array.from(target.style)) {
                const newValue = target.style.getPropertyValue(pname);
                const newPriority = target.style.getPropertyPriority(pname);
                if (newValue !== (oldStyle?.getPropertyValue(pname) || "") || newPriority !== (oldStyle?.getPropertyPriority(pname) || "")) {
                  if (newPriority === "") {
                    item.styleDiff[pname] = newValue;
                  } else {
                    item.styleDiff[pname] = [newValue, newPriority];
                  }
                } else {
                  item._unchangedStyles[pname] = [newValue, newPriority];
                }
              }
              if (oldStyle) {
                for (const pname of Array.from(oldStyle)) {
                  if (target.style.getPropertyValue(pname) === "") {
                    item.styleDiff[pname] = false;
                  }
                }
              }
            }
          }
          break;
        }
        case "childList": {
          if (isBlocked$1(
            m2.target,
            this.blockClass,
            this.blockSelector,
            this.unblockSelector,
            true
          )) {
            return;
          }
          m2.addedNodes.forEach((n2) => this.genAdds(n2, m2.target));
          m2.removedNodes.forEach((n2) => {
            const nodeId = this.mirror.getId(n2);
            const parentId = isShadowRoot(m2.target) ? this.mirror.getId(m2.target.host) : this.mirror.getId(m2.target);
            if (isBlocked$1(
              m2.target,
              this.blockClass,
              this.blockSelector,
              this.unblockSelector,
              false
            ) || isIgnored(n2, this.mirror) || !isSerialized(n2, this.mirror)) {
              return;
            }
            if (this.addedSet.has(n2)) {
              deepDelete(this.addedSet, n2);
              this.droppedSet.add(n2);
            } else if (this.addedSet.has(m2.target) && nodeId === -1) ;
            else if (isAncestorRemoved(m2.target, this.mirror)) ;
            else if (this.movedSet.has(n2) && this.movedMap[moveKey(nodeId, parentId)]) {
              deepDelete(this.movedSet, n2);
            } else {
              this.removes.push({
                parentId,
                id: nodeId,
                isShadow: isShadowRoot(m2.target) && isNativeShadowDom(m2.target) ? true : void 0
              });
            }
            this.mapRemoves.push(n2);
          });
          break;
        }
      }
    };
    this.genAdds = (n2, target) => {
      if (this.processedNodeManager.inOtherBuffer(n2, this)) return;
      if (this.addedSet.has(n2) || this.movedSet.has(n2)) return;
      if (this.mirror.hasNode(n2)) {
        if (isIgnored(n2, this.mirror)) {
          return;
        }
        this.movedSet.add(n2);
        let targetId = null;
        if (target && this.mirror.hasNode(target)) {
          targetId = this.mirror.getId(target);
        }
        if (targetId && targetId !== -1) {
          this.movedMap[moveKey(this.mirror.getId(n2), targetId)] = true;
        }
      } else {
        this.addedSet.add(n2);
        this.droppedSet.delete(n2);
      }
      if (!isBlocked$1(
        n2,
        this.blockClass,
        this.blockSelector,
        this.unblockSelector,
        false
      )) {
        if (n2.childNodes) {
          n2.childNodes.forEach((childN) => this.genAdds(childN));
        }
        if (hasShadowRoot(n2)) {
          n2.shadowRoot.childNodes.forEach((childN) => {
            this.processedNodeManager.add(childN, this);
            this.genAdds(childN, n2);
          });
        }
      }
    };
  }
  init(options) {
    [
      "mutationCb",
      "blockClass",
      "blockSelector",
      "unblockSelector",
      "maskAllText",
      "maskTextClass",
      "unmaskTextClass",
      "maskTextSelector",
      "unmaskTextSelector",
      "inlineStylesheet",
      "maskInputOptions",
      "maskAttributeFn",
      "maskTextFn",
      "maskInputFn",
      "keepIframeSrcFn",
      "recordCanvas",
      "inlineImages",
      "slimDOMOptions",
      "dataURLOptions",
      "doc",
      "mirror",
      "iframeManager",
      "stylesheetManager",
      "shadowDomManager",
      "canvasManager",
      "processedNodeManager",
      "ignoreCSSAttributes"
    ].forEach((key) => {
      this[key] = options[key];
    });
    this.styleDeclarationParser = new StyleDeclarationParser(this.doc);
  }
  freeze() {
    this.frozen = true;
    this.canvasManager.freeze();
  }
  unfreeze() {
    this.frozen = false;
    this.canvasManager.unfreeze();
    this.emit();
  }
  isFrozen() {
    return this.frozen;
  }
  lock() {
    this.locked = true;
    this.canvasManager.lock();
  }
  unlock() {
    this.locked = false;
    this.canvasManager.unlock();
    this.emit();
  }
  reset() {
    this.shadowDomManager.reset();
    this.canvasManager.reset();
  }
}
function deepDelete(addsSet, n2) {
  addsSet.delete(n2);
  n2.childNodes?.forEach((childN) => deepDelete(addsSet, childN));
}
function isParentRemoved(removes, n2, mirror2) {
  if (removes.length === 0) return false;
  return _isParentRemoved(removes, n2, mirror2);
}
function _isParentRemoved(removes, n2, mirror2) {
  let node = n2.parentNode;
  while (node) {
    const parentId = mirror2.getId(node);
    if (removes.some((r2) => r2.id === parentId)) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
}
function isAncestorInSet(set, n2) {
  if (set.size === 0) return false;
  return _isAncestorInSet(set, n2);
}
function _isAncestorInSet(set, n2) {
  const { parentNode } = n2;
  if (!parentNode) {
    return false;
  }
  if (set.has(parentNode)) {
    return true;
  }
  return _isAncestorInSet(set, parentNode);
}
const mutationBuffers = [];
function getEventTarget(event) {
  try {
    if ("composedPath" in event) {
      const path = event.composedPath();
      if (path.length) {
        return path[0];
      }
    } else if ("path" in event && event.path.length) {
      return event.path[0];
    }
  } catch {
  }
  return event && event.target;
}
function initMutationObserver(options, rootEl) {
  const mutationBuffer = new MutationBuffer();
  mutationBuffers.push(mutationBuffer);
  mutationBuffer.init(options);
  let mutationObserverCtor = window.MutationObserver || /**
  * Some websites may disable MutationObserver by removing it from the window object.
  * If someone is using rrweb to build a browser extention or things like it, they
  * could not change the website's code but can have an opportunity to inject some
  * code before the website executing its JS logic.
  * Then they can do this to store the native MutationObserver:
  * window.__rrMutationObserver = MutationObserver
  */
  window.__rrMutationObserver;
  const angularZoneSymbol = window?.Zone?.__symbol__?.("MutationObserver");
  if (angularZoneSymbol && window[angularZoneSymbol]) {
    mutationObserverCtor = window[angularZoneSymbol];
  }
  const observer = new mutationObserverCtor(
    callbackWrapper$1((mutations) => {
      if (options.onMutation && options.onMutation(mutations) === false) {
        return;
      }
      mutationBuffer.processMutations.bind(mutationBuffer)(mutations);
    })
  );
  observer.observe(rootEl, {
    attributes: true,
    attributeOldValue: true,
    characterData: true,
    characterDataOldValue: true,
    childList: true,
    subtree: true
  });
  return observer;
}
function initMoveObserver({
  mousemoveCb,
  sampling,
  doc,
  mirror: mirror2
}) {
  if (sampling.mousemove === false) {
    return () => {
    };
  }
  const threshold = typeof sampling.mousemove === "number" ? sampling.mousemove : 50;
  const callbackThreshold = typeof sampling.mousemoveCallback === "number" ? sampling.mousemoveCallback : 500;
  let positions = [];
  let timeBaseline;
  const wrappedCb = throttle$1(
    callbackWrapper$1(
      (source) => {
        const totalOffset = Date.now() - timeBaseline;
        mousemoveCb(
          positions.map((p2) => {
            p2.timeOffset -= totalOffset;
            return p2;
          }),
          source
        );
        positions = [];
        timeBaseline = null;
      }
    ),
    callbackThreshold
  );
  const updatePosition = callbackWrapper$1(
    throttle$1(
      callbackWrapper$1((evt) => {
        const target = getEventTarget(evt);
        const { clientX, clientY } = legacy_isTouchEvent(evt) ? evt.changedTouches[0] : evt;
        if (!timeBaseline) {
          timeBaseline = nowTimestamp();
        }
        positions.push({
          x: clientX,
          y: clientY,
          id: mirror2.getId(target),
          timeOffset: nowTimestamp() - timeBaseline
        });
        wrappedCb(
          typeof DragEvent !== "undefined" && evt instanceof DragEvent ? IncrementalSource.Drag : evt instanceof MouseEvent ? IncrementalSource.MouseMove : IncrementalSource.TouchMove
        );
      }),
      threshold,
      {
        trailing: false
      }
    )
  );
  const handlers2 = [
    on("mousemove", updatePosition, doc),
    on("touchmove", updatePosition, doc),
    on("drag", updatePosition, doc)
  ];
  return callbackWrapper$1(() => {
    handlers2.forEach((h2) => h2());
  });
}
function initMouseInteractionObserver({
  mouseInteractionCb,
  doc,
  mirror: mirror2,
  blockClass,
  blockSelector,
  unblockSelector,
  sampling
}) {
  if (sampling.mouseInteraction === false) {
    return () => {
    };
  }
  const disableMap = sampling.mouseInteraction === true || sampling.mouseInteraction === void 0 ? {} : sampling.mouseInteraction;
  const handlers2 = [];
  let currentPointerType = null;
  const getHandler = (eventKey) => {
    return (event) => {
      const target = getEventTarget(event);
      if (isBlocked$1(target, blockClass, blockSelector, unblockSelector, true)) {
        return;
      }
      let pointerType = null;
      let thisEventKey = eventKey;
      if ("pointerType" in event) {
        switch (event.pointerType) {
          case "mouse":
            pointerType = PointerTypes.Mouse;
            break;
          case "touch":
            pointerType = PointerTypes.Touch;
            break;
          case "pen":
            pointerType = PointerTypes.Pen;
            break;
        }
        if (pointerType === PointerTypes.Touch) {
          if (MouseInteractions[eventKey] === MouseInteractions.MouseDown) {
            thisEventKey = "TouchStart";
          } else if (MouseInteractions[eventKey] === MouseInteractions.MouseUp) {
            thisEventKey = "TouchEnd";
          }
        } else if (pointerType === PointerTypes.Pen) ;
      } else if (legacy_isTouchEvent(event)) {
        pointerType = PointerTypes.Touch;
      }
      if (pointerType !== null) {
        currentPointerType = pointerType;
        if (thisEventKey.startsWith("Touch") && pointerType === PointerTypes.Touch || thisEventKey.startsWith("Mouse") && pointerType === PointerTypes.Mouse) {
          pointerType = null;
        }
      } else if (MouseInteractions[eventKey] === MouseInteractions.Click) {
        pointerType = currentPointerType;
        currentPointerType = null;
      }
      const e2 = legacy_isTouchEvent(event) ? event.changedTouches[0] : event;
      if (!e2) {
        return;
      }
      const id = mirror2.getId(target);
      const { clientX, clientY } = e2;
      callbackWrapper$1(mouseInteractionCb)({
        type: MouseInteractions[thisEventKey],
        id,
        x: clientX,
        y: clientY,
        ...pointerType !== null && { pointerType }
      });
    };
  };
  Object.keys(MouseInteractions).filter(
    (key) => Number.isNaN(Number(key)) && !key.endsWith("_Departed") && disableMap[key] !== false
  ).forEach((eventKey) => {
    let eventName = toLowerCase(eventKey);
    const handler = getHandler(eventKey);
    if (window.PointerEvent) {
      switch (MouseInteractions[eventKey]) {
        case MouseInteractions.MouseDown:
        case MouseInteractions.MouseUp:
          eventName = eventName.replace(
            "mouse",
            "pointer"
          );
          break;
        case MouseInteractions.TouchStart:
        case MouseInteractions.TouchEnd:
          return;
      }
    }
    handlers2.push(on(eventName, handler, doc));
  });
  return callbackWrapper$1(() => {
    handlers2.forEach((h2) => h2());
  });
}
function initScrollObserver({
  scrollCb,
  doc,
  mirror: mirror2,
  blockClass,
  blockSelector,
  unblockSelector,
  sampling
}) {
  const updatePosition = callbackWrapper$1(
    throttle$1(
      callbackWrapper$1((evt) => {
        const target = getEventTarget(evt);
        if (!target || isBlocked$1(
          target,
          blockClass,
          blockSelector,
          unblockSelector,
          true
        )) {
          return;
        }
        const id = mirror2.getId(target);
        if (target === doc && doc.defaultView) {
          const scrollLeftTop = getWindowScroll(doc.defaultView);
          scrollCb({
            id,
            x: scrollLeftTop.left,
            y: scrollLeftTop.top
          });
        } else {
          scrollCb({
            id,
            x: target.scrollLeft,
            y: target.scrollTop
          });
        }
      }),
      sampling.scroll || 100
    )
  );
  return on("scroll", updatePosition, doc);
}
function initViewportResizeObserver({ viewportResizeCb }, { win }) {
  let lastH = -1;
  let lastW = -1;
  const updateDimension = callbackWrapper$1(
    throttle$1(
      callbackWrapper$1(() => {
        const height = getWindowHeight();
        const width = getWindowWidth();
        if (lastH !== height || lastW !== width) {
          viewportResizeCb({
            width: Number(width),
            height: Number(height)
          });
          lastH = height;
          lastW = width;
        }
      }),
      200
    )
  );
  return on("resize", updateDimension, win);
}
const INPUT_TAGS = ["INPUT", "TEXTAREA", "SELECT"];
const lastInputValueMap = /* @__PURE__ */ new WeakMap();
function initInputObserver({
  inputCb,
  doc,
  mirror: mirror2,
  blockClass,
  blockSelector,
  unblockSelector,
  ignoreClass,
  ignoreSelector,
  maskInputOptions,
  maskInputFn,
  sampling,
  userTriggeredOnInput,
  maskTextClass,
  unmaskTextClass,
  maskTextSelector,
  unmaskTextSelector
}) {
  function eventHandler(event) {
    let target = getEventTarget(event);
    const userTriggered = event.isTrusted;
    const tagName = target && toUpperCase(target.tagName);
    if (tagName === "OPTION") target = target.parentElement;
    if (!target || !tagName || INPUT_TAGS.indexOf(tagName) < 0 || isBlocked$1(
      target,
      blockClass,
      blockSelector,
      unblockSelector,
      true
    )) {
      return;
    }
    const el = target;
    if (el.classList.contains(ignoreClass) || ignoreSelector && el.matches(ignoreSelector)) {
      return;
    }
    const type = getInputType(target);
    let text = getInputValue(el, tagName, type);
    let isChecked = false;
    const isInputMasked = shouldMaskInput({
      maskInputOptions,
      tagName,
      type
    });
    const forceMask = needMaskingText(
      target,
      maskTextClass,
      maskTextSelector,
      unmaskTextClass,
      unmaskTextSelector,
      isInputMasked
    );
    if (type === "radio" || type === "checkbox") {
      isChecked = target.checked;
    }
    text = maskInputValue({
      isMasked: forceMask,
      element: target,
      value: text,
      maskInputFn
    });
    cbWithDedup(
      target,
      userTriggeredOnInput ? { text, isChecked, userTriggered } : { text, isChecked }
    );
    const name = target.name;
    if (type === "radio" && name && isChecked) {
      doc.querySelectorAll(`input[type="radio"][name="${name}"]`).forEach((el2) => {
        if (el2 !== target) {
          const text2 = maskInputValue({
            // share mask behavior of `target`
            isMasked: forceMask,
            element: el2,
            value: getInputValue(el2, tagName, type),
            maskInputFn
          });
          cbWithDedup(
            el2,
            userTriggeredOnInput ? { text: text2, isChecked: !isChecked, userTriggered: false } : { text: text2, isChecked: !isChecked }
          );
        }
      });
    }
  }
  function cbWithDedup(target, v2) {
    const lastInputValue = lastInputValueMap.get(target);
    if (!lastInputValue || lastInputValue.text !== v2.text || lastInputValue.isChecked !== v2.isChecked) {
      lastInputValueMap.set(target, v2);
      const id = mirror2.getId(target);
      callbackWrapper$1(inputCb)({
        ...v2,
        id
      });
    }
  }
  const events = sampling.input === "last" ? ["change"] : ["input", "change"];
  const handlers2 = events.map(
    (eventName) => on(eventName, callbackWrapper$1(eventHandler), doc)
  );
  const currentWindow = doc.defaultView;
  if (!currentWindow) {
    return () => {
      handlers2.forEach((h2) => h2());
    };
  }
  const propertyDescriptor = currentWindow.Object.getOwnPropertyDescriptor(
    currentWindow.HTMLInputElement.prototype,
    "value"
  );
  const hookProperties = [
    [currentWindow.HTMLInputElement.prototype, "value"],
    [currentWindow.HTMLInputElement.prototype, "checked"],
    [currentWindow.HTMLSelectElement.prototype, "value"],
    [currentWindow.HTMLTextAreaElement.prototype, "value"],
    // Some UI library use selectedIndex to set select value
    [currentWindow.HTMLSelectElement.prototype, "selectedIndex"],
    [currentWindow.HTMLOptionElement.prototype, "selected"]
  ];
  if (propertyDescriptor && propertyDescriptor.set) {
    handlers2.push(
      ...hookProperties.map(
        (p2) => hookSetter$1(
          p2[0],
          p2[1],
          {
            set() {
              callbackWrapper$1(eventHandler)({
                target: this,
                isTrusted: false
                // userTriggered to false as this could well be programmatic
              });
            }
          },
          false,
          currentWindow
        )
      )
    );
  }
  return callbackWrapper$1(() => {
    handlers2.forEach((h2) => h2());
  });
}
function getNestedCSSRulePositions(rule) {
  const positions = [];
  function recurse(childRule, pos) {
    if (hasNestedCSSRule("CSSGroupingRule") && childRule.parentRule instanceof CSSGroupingRule || hasNestedCSSRule("CSSMediaRule") && childRule.parentRule instanceof CSSMediaRule || hasNestedCSSRule("CSSSupportsRule") && childRule.parentRule instanceof CSSSupportsRule || hasNestedCSSRule("CSSConditionRule") && childRule.parentRule instanceof CSSConditionRule) {
      const rules2 = Array.from(
        childRule.parentRule.cssRules
      );
      const index = rules2.indexOf(childRule);
      pos.unshift(index);
    } else if (childRule.parentStyleSheet) {
      const rules2 = Array.from(childRule.parentStyleSheet.cssRules);
      const index = rules2.indexOf(childRule);
      pos.unshift(index);
    }
    return pos;
  }
  return recurse(rule, positions);
}
function getIdAndStyleId(sheet, mirror2, styleMirror) {
  let id, styleId;
  if (!sheet) return {};
  if (sheet.ownerNode) id = mirror2.getId(sheet.ownerNode);
  else styleId = styleMirror.getId(sheet);
  return {
    styleId,
    id
  };
}
function initStyleSheetObserver({ styleSheetRuleCb, mirror: mirror2, stylesheetManager }, { win }) {
  if (!win.CSSStyleSheet || !win.CSSStyleSheet.prototype) {
    return () => {
    };
  }
  const insertRule = win.CSSStyleSheet.prototype.insertRule;
  win.CSSStyleSheet.prototype.insertRule = new Proxy(insertRule, {
    apply: callbackWrapper$1(
      (target, thisArg, argumentsList) => {
        const [rule, index] = argumentsList;
        const { id, styleId } = getIdAndStyleId(
          thisArg,
          mirror2,
          stylesheetManager.styleMirror
        );
        if (id && id !== -1 || styleId && styleId !== -1) {
          styleSheetRuleCb({
            id,
            styleId,
            adds: [{ rule, index }]
          });
        }
        return target.apply(thisArg, argumentsList);
      }
    )
  });
  const deleteRule = win.CSSStyleSheet.prototype.deleteRule;
  win.CSSStyleSheet.prototype.deleteRule = new Proxy(deleteRule, {
    apply: callbackWrapper$1(
      (target, thisArg, argumentsList) => {
        const [index] = argumentsList;
        const { id, styleId } = getIdAndStyleId(
          thisArg,
          mirror2,
          stylesheetManager.styleMirror
        );
        if (id && id !== -1 || styleId && styleId !== -1) {
          styleSheetRuleCb({
            id,
            styleId,
            removes: [{ index }]
          });
        }
        return target.apply(thisArg, argumentsList);
      }
    )
  });
  let replace;
  if (win.CSSStyleSheet.prototype.replace) {
    replace = win.CSSStyleSheet.prototype.replace;
    win.CSSStyleSheet.prototype.replace = new Proxy(replace, {
      apply: callbackWrapper$1(
        (target, thisArg, argumentsList) => {
          const [text] = argumentsList;
          const { id, styleId } = getIdAndStyleId(
            thisArg,
            mirror2,
            stylesheetManager.styleMirror
          );
          if (id && id !== -1 || styleId && styleId !== -1) {
            styleSheetRuleCb({
              id,
              styleId,
              replace: text
            });
          }
          return target.apply(thisArg, argumentsList);
        }
      )
    });
  }
  let replaceSync;
  if (win.CSSStyleSheet.prototype.replaceSync) {
    replaceSync = win.CSSStyleSheet.prototype.replaceSync;
    win.CSSStyleSheet.prototype.replaceSync = new Proxy(replaceSync, {
      apply: callbackWrapper$1(
        (target, thisArg, argumentsList) => {
          const [text] = argumentsList;
          const { id, styleId } = getIdAndStyleId(
            thisArg,
            mirror2,
            stylesheetManager.styleMirror
          );
          if (id && id !== -1 || styleId && styleId !== -1) {
            styleSheetRuleCb({
              id,
              styleId,
              replaceSync: text
            });
          }
          return target.apply(thisArg, argumentsList);
        }
      )
    });
  }
  const supportedNestedCSSRuleTypes = {};
  if (canMonkeyPatchNestedCSSRule("CSSGroupingRule")) {
    supportedNestedCSSRuleTypes.CSSGroupingRule = win.CSSGroupingRule;
  } else {
    if (canMonkeyPatchNestedCSSRule("CSSMediaRule")) {
      supportedNestedCSSRuleTypes.CSSMediaRule = win.CSSMediaRule;
    }
    if (canMonkeyPatchNestedCSSRule("CSSConditionRule")) {
      supportedNestedCSSRuleTypes.CSSConditionRule = win.CSSConditionRule;
    }
    if (canMonkeyPatchNestedCSSRule("CSSSupportsRule")) {
      supportedNestedCSSRuleTypes.CSSSupportsRule = win.CSSSupportsRule;
    }
  }
  const unmodifiedFunctions = {};
  Object.entries(supportedNestedCSSRuleTypes).forEach(([typeKey, type]) => {
    unmodifiedFunctions[typeKey] = {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      insertRule: type.prototype.insertRule,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      deleteRule: type.prototype.deleteRule
    };
    type.prototype.insertRule = new Proxy(
      unmodifiedFunctions[typeKey].insertRule,
      {
        apply: callbackWrapper$1(
          (target, thisArg, argumentsList) => {
            const [rule, index] = argumentsList;
            const { id, styleId } = getIdAndStyleId(
              thisArg.parentStyleSheet,
              mirror2,
              stylesheetManager.styleMirror
            );
            if (id && id !== -1 || styleId && styleId !== -1) {
              styleSheetRuleCb({
                id,
                styleId,
                adds: [
                  {
                    rule,
                    index: [
                      ...getNestedCSSRulePositions(thisArg),
                      index || 0
                      // defaults to 0
                    ]
                  }
                ]
              });
            }
            return target.apply(thisArg, argumentsList);
          }
        )
      }
    );
    type.prototype.deleteRule = new Proxy(
      unmodifiedFunctions[typeKey].deleteRule,
      {
        apply: callbackWrapper$1(
          (target, thisArg, argumentsList) => {
            const [index] = argumentsList;
            const { id, styleId } = getIdAndStyleId(
              thisArg.parentStyleSheet,
              mirror2,
              stylesheetManager.styleMirror
            );
            if (id && id !== -1 || styleId && styleId !== -1) {
              styleSheetRuleCb({
                id,
                styleId,
                removes: [
                  { index: [...getNestedCSSRulePositions(thisArg), index] }
                ]
              });
            }
            return target.apply(thisArg, argumentsList);
          }
        )
      }
    );
  });
  return callbackWrapper$1(() => {
    win.CSSStyleSheet.prototype.insertRule = insertRule;
    win.CSSStyleSheet.prototype.deleteRule = deleteRule;
    replace && (win.CSSStyleSheet.prototype.replace = replace);
    replaceSync && (win.CSSStyleSheet.prototype.replaceSync = replaceSync);
    Object.entries(supportedNestedCSSRuleTypes).forEach(([typeKey, type]) => {
      type.prototype.insertRule = unmodifiedFunctions[typeKey].insertRule;
      type.prototype.deleteRule = unmodifiedFunctions[typeKey].deleteRule;
    });
  });
}
function initAdoptedStyleSheetObserver({
  mirror: mirror2,
  stylesheetManager
}, host) {
  let hostId = null;
  if (host.nodeName === "#document") hostId = mirror2.getId(host);
  else hostId = mirror2.getId(host.host);
  const patchTarget = host.nodeName === "#document" ? host.defaultView?.Document : host.ownerDocument?.defaultView?.ShadowRoot;
  const originalPropertyDescriptor = patchTarget?.prototype ? Object.getOwnPropertyDescriptor(
    patchTarget?.prototype,
    "adoptedStyleSheets"
  ) : void 0;
  if (hostId === null || hostId === -1 || !patchTarget || !originalPropertyDescriptor)
    return () => {
    };
  Object.defineProperty(host, "adoptedStyleSheets", {
    configurable: originalPropertyDescriptor.configurable,
    enumerable: originalPropertyDescriptor.enumerable,
    get() {
      return originalPropertyDescriptor.get?.call(this);
    },
    set(sheets) {
      const result = originalPropertyDescriptor.set?.call(this, sheets);
      if (hostId !== null && hostId !== -1) {
        try {
          stylesheetManager.adoptStyleSheets(sheets, hostId);
        } catch (e2) {
        }
      }
      return result;
    }
  });
  return callbackWrapper$1(() => {
    Object.defineProperty(host, "adoptedStyleSheets", {
      configurable: originalPropertyDescriptor.configurable,
      enumerable: originalPropertyDescriptor.enumerable,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      get: originalPropertyDescriptor.get,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      set: originalPropertyDescriptor.set
    });
  });
}
function initStyleDeclarationObserver({
  styleDeclarationCb,
  mirror: mirror2,
  ignoreCSSAttributes,
  stylesheetManager
}, { win }) {
  const setProperty = win.CSSStyleDeclaration.prototype.setProperty;
  win.CSSStyleDeclaration.prototype.setProperty = new Proxy(setProperty, {
    apply: callbackWrapper$1(
      (target, thisArg, argumentsList) => {
        const [property, value, priority] = argumentsList;
        if (ignoreCSSAttributes.has(property)) {
          return setProperty.apply(thisArg, [property, value, priority]);
        }
        const { id, styleId } = getIdAndStyleId(
          thisArg.parentRule?.parentStyleSheet,
          mirror2,
          stylesheetManager.styleMirror
        );
        if (id && id !== -1 || styleId && styleId !== -1) {
          styleDeclarationCb({
            id,
            styleId,
            set: {
              property,
              value,
              priority
            },
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            index: getNestedCSSRulePositions(thisArg.parentRule)
          });
        }
        return target.apply(thisArg, argumentsList);
      }
    )
  });
  const removeProperty = win.CSSStyleDeclaration.prototype.removeProperty;
  win.CSSStyleDeclaration.prototype.removeProperty = new Proxy(removeProperty, {
    apply: callbackWrapper$1(
      (target, thisArg, argumentsList) => {
        const [property] = argumentsList;
        if (ignoreCSSAttributes.has(property)) {
          return removeProperty.apply(thisArg, [property]);
        }
        const { id, styleId } = getIdAndStyleId(
          thisArg.parentRule?.parentStyleSheet,
          mirror2,
          stylesheetManager.styleMirror
        );
        if (id && id !== -1 || styleId && styleId !== -1) {
          styleDeclarationCb({
            id,
            styleId,
            remove: {
              property
            },
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            index: getNestedCSSRulePositions(thisArg.parentRule)
          });
        }
        return target.apply(thisArg, argumentsList);
      }
    )
  });
  return callbackWrapper$1(() => {
    win.CSSStyleDeclaration.prototype.setProperty = setProperty;
    win.CSSStyleDeclaration.prototype.removeProperty = removeProperty;
  });
}
function initMediaInteractionObserver({
  mediaInteractionCb,
  blockClass,
  blockSelector,
  unblockSelector,
  mirror: mirror2,
  sampling,
  doc
}) {
  const handler = callbackWrapper$1(
    (type) => throttle$1(
      callbackWrapper$1((event) => {
        const target = getEventTarget(event);
        if (!target || isBlocked$1(
          target,
          blockClass,
          blockSelector,
          unblockSelector,
          true
        )) {
          return;
        }
        const { currentTime, volume, muted, playbackRate } = target;
        mediaInteractionCb({
          type,
          id: mirror2.getId(target),
          currentTime,
          volume,
          muted,
          playbackRate
        });
      }),
      sampling.media || 500
    )
  );
  const handlers2 = [
    on("play", handler(MediaInteractions.Play), doc),
    on("pause", handler(MediaInteractions.Pause), doc),
    on("seeked", handler(MediaInteractions.Seeked), doc),
    on("volumechange", handler(MediaInteractions.VolumeChange), doc),
    on("ratechange", handler(MediaInteractions.RateChange), doc)
  ];
  return callbackWrapper$1(() => {
    handlers2.forEach((h2) => h2());
  });
}
function initFontObserver({ fontCb, doc }) {
  const win = doc.defaultView;
  if (!win) {
    return () => {
    };
  }
  const handlers2 = [];
  const fontMap = /* @__PURE__ */ new WeakMap();
  const originalFontFace = win.FontFace;
  win.FontFace = function FontFace2(family, source, descriptors) {
    const fontFace = new originalFontFace(family, source, descriptors);
    fontMap.set(fontFace, {
      family,
      buffer: typeof source !== "string",
      descriptors,
      fontSource: typeof source === "string" ? source : JSON.stringify(Array.from(new Uint8Array(source)))
    });
    return fontFace;
  };
  const restoreHandler = patch$1(
    doc.fonts,
    "add",
    function(original) {
      return function(fontFace) {
        setTimeout$2(
          callbackWrapper$1(() => {
            const p2 = fontMap.get(fontFace);
            if (p2) {
              fontCb(p2);
              fontMap.delete(fontFace);
            }
          }),
          0
        );
        return original.apply(this, [fontFace]);
      };
    }
  );
  handlers2.push(() => {
    win.FontFace = originalFontFace;
  });
  handlers2.push(restoreHandler);
  return callbackWrapper$1(() => {
    handlers2.forEach((h2) => h2());
  });
}
function initSelectionObserver(param) {
  const {
    doc,
    mirror: mirror2,
    blockClass,
    blockSelector,
    unblockSelector,
    selectionCb
  } = param;
  let collapsed = true;
  const updateSelection = callbackWrapper$1(() => {
    const selection = doc.getSelection();
    if (!selection || collapsed && selection?.isCollapsed) return;
    collapsed = selection.isCollapsed || false;
    const ranges = [];
    const count2 = selection.rangeCount || 0;
    for (let i2 = 0; i2 < count2; i2++) {
      const range = selection.getRangeAt(i2);
      const { startContainer, startOffset, endContainer, endOffset } = range;
      const blocked = isBlocked$1(
        startContainer,
        blockClass,
        blockSelector,
        unblockSelector,
        true
      ) || isBlocked$1(
        endContainer,
        blockClass,
        blockSelector,
        unblockSelector,
        true
      );
      if (blocked) continue;
      ranges.push({
        start: mirror2.getId(startContainer),
        startOffset,
        end: mirror2.getId(endContainer),
        endOffset
      });
    }
    selectionCb({ ranges });
  });
  updateSelection();
  return on("selectionchange", updateSelection);
}
function initCustomElementObserver({
  doc,
  customElementCb
}) {
  const win = doc.defaultView;
  if (!win || !win.customElements) return () => {
  };
  const restoreHandler = patch$1(
    win.customElements,
    "define",
    function(original) {
      return function(name, constructor, options) {
        try {
          customElementCb({
            define: {
              name
            }
          });
        } catch (e2) {
        }
        return original.apply(this, [name, constructor, options]);
      };
    }
  );
  return restoreHandler;
}
function initObservers(o2, _hooks = {}) {
  const currentWindow = o2.doc.defaultView;
  if (!currentWindow) {
    return () => {
    };
  }
  let mutationObserver;
  if (o2.recordDOM) {
    mutationObserver = initMutationObserver(o2, o2.doc);
  }
  const mousemoveHandler = initMoveObserver(o2);
  const mouseInteractionHandler = initMouseInteractionObserver(o2);
  const scrollHandler = initScrollObserver(o2);
  const viewportResizeHandler = initViewportResizeObserver(o2, {
    win: currentWindow
  });
  const inputHandler = initInputObserver(o2);
  const mediaInteractionHandler = initMediaInteractionObserver(o2);
  let styleSheetObserver = () => {
  };
  let adoptedStyleSheetObserver = () => {
  };
  let styleDeclarationObserver = () => {
  };
  let fontObserver = () => {
  };
  if (o2.recordDOM) {
    styleSheetObserver = initStyleSheetObserver(o2, { win: currentWindow });
    adoptedStyleSheetObserver = initAdoptedStyleSheetObserver(o2, o2.doc);
    styleDeclarationObserver = initStyleDeclarationObserver(o2, {
      win: currentWindow
    });
    if (o2.collectFonts) {
      fontObserver = initFontObserver(o2);
    }
  }
  const selectionObserver = initSelectionObserver(o2);
  const customElementObserver = initCustomElementObserver(o2);
  const pluginHandlers = [];
  for (const plugin of o2.plugins) {
    pluginHandlers.push(
      plugin.observer(plugin.callback, currentWindow, plugin.options)
    );
  }
  return callbackWrapper$1(() => {
    mutationBuffers.forEach((b2) => b2.reset());
    mutationObserver?.disconnect();
    mousemoveHandler();
    mouseInteractionHandler();
    scrollHandler();
    viewportResizeHandler();
    inputHandler();
    mediaInteractionHandler();
    styleSheetObserver();
    adoptedStyleSheetObserver();
    styleDeclarationObserver();
    fontObserver();
    selectionObserver();
    customElementObserver();
    pluginHandlers.forEach((h2) => h2());
  });
}
function hasNestedCSSRule(prop) {
  return typeof window[prop] !== "undefined";
}
function canMonkeyPatchNestedCSSRule(prop) {
  return Boolean(
    typeof window[prop] !== "undefined" && // Note: Generally, this check _shouldn't_ be necessary
    // However, in some scenarios (e.g. jsdom) this can sometimes fail, so we check for it here
    window[prop].prototype && "insertRule" in window[prop].prototype && "deleteRule" in window[prop].prototype
  );
}
class CrossOriginIframeMirror {
  constructor(generateIdFn) {
    this.generateIdFn = generateIdFn;
    this.iframeIdToRemoteIdMap = /* @__PURE__ */ new WeakMap();
    this.iframeRemoteIdToIdMap = /* @__PURE__ */ new WeakMap();
  }
  getId(iframe, remoteId, idToRemoteMap, remoteToIdMap) {
    const idToRemoteIdMap = idToRemoteMap || this.getIdToRemoteIdMap(iframe);
    const remoteIdToIdMap = remoteToIdMap || this.getRemoteIdToIdMap(iframe);
    let id = idToRemoteIdMap.get(remoteId);
    if (!id) {
      id = this.generateIdFn();
      idToRemoteIdMap.set(remoteId, id);
      remoteIdToIdMap.set(id, remoteId);
    }
    return id;
  }
  getIds(iframe, remoteId) {
    const idToRemoteIdMap = this.getIdToRemoteIdMap(iframe);
    const remoteIdToIdMap = this.getRemoteIdToIdMap(iframe);
    return remoteId.map(
      (id) => this.getId(iframe, id, idToRemoteIdMap, remoteIdToIdMap)
    );
  }
  getRemoteId(iframe, id, map) {
    const remoteIdToIdMap = map || this.getRemoteIdToIdMap(iframe);
    if (typeof id !== "number") return id;
    const remoteId = remoteIdToIdMap.get(id);
    if (!remoteId) return -1;
    return remoteId;
  }
  getRemoteIds(iframe, ids) {
    const remoteIdToIdMap = this.getRemoteIdToIdMap(iframe);
    return ids.map((id) => this.getRemoteId(iframe, id, remoteIdToIdMap));
  }
  reset(iframe) {
    if (!iframe) {
      this.iframeIdToRemoteIdMap = /* @__PURE__ */ new WeakMap();
      this.iframeRemoteIdToIdMap = /* @__PURE__ */ new WeakMap();
      return;
    }
    this.iframeIdToRemoteIdMap.delete(iframe);
    this.iframeRemoteIdToIdMap.delete(iframe);
  }
  getIdToRemoteIdMap(iframe) {
    let idToRemoteIdMap = this.iframeIdToRemoteIdMap.get(iframe);
    if (!idToRemoteIdMap) {
      idToRemoteIdMap = /* @__PURE__ */ new Map();
      this.iframeIdToRemoteIdMap.set(iframe, idToRemoteIdMap);
    }
    return idToRemoteIdMap;
  }
  getRemoteIdToIdMap(iframe) {
    let remoteIdToIdMap = this.iframeRemoteIdToIdMap.get(iframe);
    if (!remoteIdToIdMap) {
      remoteIdToIdMap = /* @__PURE__ */ new Map();
      this.iframeRemoteIdToIdMap.set(iframe, remoteIdToIdMap);
    }
    return remoteIdToIdMap;
  }
}
class IframeManagerNoop {
  constructor() {
    this.crossOriginIframeMirror = new CrossOriginIframeMirror(genId);
    this.crossOriginIframeRootIdMap = /* @__PURE__ */ new WeakMap();
  }
  addIframe() {
  }
  addLoadListener() {
  }
  attachIframe() {
  }
}
class IframeManager {
  constructor(options) {
    this.iframes = /* @__PURE__ */ new WeakMap();
    this.crossOriginIframeMap = /* @__PURE__ */ new WeakMap();
    this.crossOriginIframeMirror = new CrossOriginIframeMirror(genId);
    this.crossOriginIframeRootIdMap = /* @__PURE__ */ new WeakMap();
    this.mutationCb = options.mutationCb;
    this.wrappedEmit = options.wrappedEmit;
    this.stylesheetManager = options.stylesheetManager;
    this.recordCrossOriginIframes = options.recordCrossOriginIframes;
    this.crossOriginIframeStyleMirror = new CrossOriginIframeMirror(
      this.stylesheetManager.styleMirror.generateId.bind(
        this.stylesheetManager.styleMirror
      )
    );
    this.mirror = options.mirror;
    if (this.recordCrossOriginIframes) {
      window.addEventListener("message", this.handleMessage.bind(this));
    }
  }
  addIframe(iframeEl) {
    this.iframes.set(iframeEl, true);
    const contentWindow = getIFrameContentWindow(iframeEl);
    if (contentWindow) this.crossOriginIframeMap.set(contentWindow, iframeEl);
  }
  addLoadListener(cb) {
    this.loadListener = cb;
  }
  attachIframe(iframeEl, childSn) {
    this.mutationCb({
      adds: [
        {
          parentId: this.mirror.getId(iframeEl),
          nextId: null,
          node: childSn
        }
      ],
      removes: [],
      texts: [],
      attributes: [],
      isAttachIframe: true
    });
    if (this.recordCrossOriginIframes) {
      getIFrameContentWindow(iframeEl)?.addEventListener(
        "message",
        this.handleMessage.bind(this)
      );
    }
    this.loadListener?.(iframeEl);
    const iframeDoc = getIFrameContentDocument(iframeEl);
    if (iframeDoc && iframeDoc.adoptedStyleSheets && iframeDoc.adoptedStyleSheets.length > 0)
      this.stylesheetManager.adoptStyleSheets(
        iframeDoc.adoptedStyleSheets,
        this.mirror.getId(iframeDoc)
      );
  }
  handleMessage(message) {
    const crossOriginMessageEvent = message;
    if (crossOriginMessageEvent.data.type !== "rrweb" || // To filter out the rrweb messages which are forwarded by some sites.
    crossOriginMessageEvent.origin !== crossOriginMessageEvent.data.origin)
      return;
    const iframeSourceWindow = message.source;
    if (!iframeSourceWindow) return;
    const iframeEl = this.crossOriginIframeMap.get(message.source);
    if (!iframeEl) return;
    const transformedEvent = this.transformCrossOriginEvent(
      iframeEl,
      crossOriginMessageEvent.data.event
    );
    if (transformedEvent)
      this.wrappedEmit(
        transformedEvent,
        crossOriginMessageEvent.data.isCheckout
      );
  }
  transformCrossOriginEvent(iframeEl, e2) {
    switch (e2.type) {
      case EventType.FullSnapshot: {
        this.crossOriginIframeMirror.reset(iframeEl);
        this.crossOriginIframeStyleMirror.reset(iframeEl);
        this.replaceIdOnNode(e2.data.node, iframeEl);
        const rootId = e2.data.node.id;
        this.crossOriginIframeRootIdMap.set(iframeEl, rootId);
        this.patchRootIdOnNode(e2.data.node, rootId);
        return {
          timestamp: e2.timestamp,
          type: EventType.IncrementalSnapshot,
          data: {
            source: IncrementalSource.Mutation,
            adds: [
              {
                parentId: this.mirror.getId(iframeEl),
                nextId: null,
                node: e2.data.node
              }
            ],
            removes: [],
            texts: [],
            attributes: [],
            isAttachIframe: true
          }
        };
      }
      case EventType.Meta:
      case EventType.Load:
      case EventType.DomContentLoaded: {
        return false;
      }
      case EventType.Plugin: {
        return e2;
      }
      case EventType.Custom: {
        this.replaceIds(
          e2.data.payload,
          iframeEl,
          ["id", "parentId", "previousId", "nextId"]
        );
        return e2;
      }
      case EventType.IncrementalSnapshot: {
        switch (e2.data.source) {
          case IncrementalSource.Mutation: {
            e2.data.adds.forEach((n2) => {
              this.replaceIds(n2, iframeEl, [
                "parentId",
                "nextId",
                "previousId"
              ]);
              this.replaceIdOnNode(n2.node, iframeEl);
              const rootId = this.crossOriginIframeRootIdMap.get(iframeEl);
              rootId && this.patchRootIdOnNode(n2.node, rootId);
            });
            e2.data.removes.forEach((n2) => {
              this.replaceIds(n2, iframeEl, ["parentId", "id"]);
            });
            e2.data.attributes.forEach((n2) => {
              this.replaceIds(n2, iframeEl, ["id"]);
            });
            e2.data.texts.forEach((n2) => {
              this.replaceIds(n2, iframeEl, ["id"]);
            });
            return e2;
          }
          case IncrementalSource.Drag:
          case IncrementalSource.TouchMove:
          case IncrementalSource.MouseMove: {
            e2.data.positions.forEach((p2) => {
              this.replaceIds(p2, iframeEl, ["id"]);
            });
            return e2;
          }
          case IncrementalSource.ViewportResize: {
            return false;
          }
          case IncrementalSource.MediaInteraction:
          case IncrementalSource.MouseInteraction:
          case IncrementalSource.Scroll:
          case IncrementalSource.CanvasMutation:
          case IncrementalSource.Input: {
            this.replaceIds(e2.data, iframeEl, ["id"]);
            return e2;
          }
          case IncrementalSource.StyleSheetRule:
          case IncrementalSource.StyleDeclaration: {
            this.replaceIds(e2.data, iframeEl, ["id"]);
            this.replaceStyleIds(e2.data, iframeEl, ["styleId"]);
            return e2;
          }
          case IncrementalSource.Font: {
            return e2;
          }
          case IncrementalSource.Selection: {
            e2.data.ranges.forEach((range) => {
              this.replaceIds(range, iframeEl, ["start", "end"]);
            });
            return e2;
          }
          case IncrementalSource.AdoptedStyleSheet: {
            this.replaceIds(e2.data, iframeEl, ["id"]);
            this.replaceStyleIds(e2.data, iframeEl, ["styleIds"]);
            e2.data.styles?.forEach((style) => {
              this.replaceStyleIds(style, iframeEl, ["styleId"]);
            });
            return e2;
          }
        }
      }
    }
    return false;
  }
  replace(iframeMirror, obj, iframeEl, keys2) {
    for (const key of keys2) {
      if (!Array.isArray(obj[key]) && typeof obj[key] !== "number") continue;
      if (Array.isArray(obj[key])) {
        obj[key] = iframeMirror.getIds(
          iframeEl,
          obj[key]
        );
      } else {
        obj[key] = iframeMirror.getId(iframeEl, obj[key]);
      }
    }
    return obj;
  }
  replaceIds(obj, iframeEl, keys2) {
    return this.replace(this.crossOriginIframeMirror, obj, iframeEl, keys2);
  }
  replaceStyleIds(obj, iframeEl, keys2) {
    return this.replace(this.crossOriginIframeStyleMirror, obj, iframeEl, keys2);
  }
  replaceIdOnNode(node, iframeEl) {
    this.replaceIds(node, iframeEl, ["id", "rootId"]);
    if ("childNodes" in node) {
      node.childNodes.forEach((child) => {
        this.replaceIdOnNode(child, iframeEl);
      });
    }
  }
  patchRootIdOnNode(node, rootId) {
    if (node.type !== NodeType$1.Document && !node.rootId) node.rootId = rootId;
    if ("childNodes" in node) {
      node.childNodes.forEach((child) => {
        this.patchRootIdOnNode(child, rootId);
      });
    }
  }
}
class ShadowDomManagerNoop {
  init() {
  }
  addShadowRoot() {
  }
  observeAttachShadow() {
  }
  reset() {
  }
}
class ShadowDomManager {
  constructor(options) {
    this.shadowDoms = /* @__PURE__ */ new WeakSet();
    this.restoreHandlers = [];
    this.mutationCb = options.mutationCb;
    this.scrollCb = options.scrollCb;
    this.bypassOptions = options.bypassOptions;
    this.mirror = options.mirror;
    this.init();
  }
  init() {
    this.reset();
    this.patchAttachShadow(Element, document);
  }
  addShadowRoot(shadowRoot, doc) {
    if (!isNativeShadowDom(shadowRoot)) return;
    if (this.shadowDoms.has(shadowRoot)) return;
    this.shadowDoms.add(shadowRoot);
    this.bypassOptions.canvasManager.addShadowRoot(shadowRoot);
    const observer = initMutationObserver(
      {
        ...this.bypassOptions,
        doc,
        mutationCb: this.mutationCb,
        mirror: this.mirror,
        shadowDomManager: this
      },
      shadowRoot
    );
    this.restoreHandlers.push(() => observer.disconnect());
    this.restoreHandlers.push(
      initScrollObserver({
        ...this.bypassOptions,
        scrollCb: this.scrollCb,
        // https://gist.github.com/praveenpuglia/0832da687ed5a5d7a0907046c9ef1813
        // scroll is not allowed to pass the boundary, so we need to listen the shadow document
        doc: shadowRoot,
        mirror: this.mirror
      })
    );
    setTimeout$2(() => {
      if (shadowRoot.adoptedStyleSheets && shadowRoot.adoptedStyleSheets.length > 0)
        this.bypassOptions.stylesheetManager.adoptStyleSheets(
          shadowRoot.adoptedStyleSheets,
          this.mirror.getId(shadowRoot.host)
        );
      this.restoreHandlers.push(
        initAdoptedStyleSheetObserver(
          {
            mirror: this.mirror,
            stylesheetManager: this.bypassOptions.stylesheetManager
          },
          shadowRoot
        )
      );
    }, 0);
  }
  /**
   * Monkey patch 'attachShadow' of an IFrameElement to observe newly added shadow doms.
   */
  observeAttachShadow(iframeElement) {
    const iframeDoc = getIFrameContentDocument(iframeElement);
    const iframeWindow = getIFrameContentWindow(iframeElement);
    if (!iframeDoc || !iframeWindow) return;
    this.patchAttachShadow(
      iframeWindow.Element,
      iframeDoc
    );
  }
  /**
   * Patch 'attachShadow' to observe newly added shadow doms.
   */
  patchAttachShadow(element, doc) {
    const manager = this;
    this.restoreHandlers.push(
      patch$1(
        element.prototype,
        "attachShadow",
        function(original) {
          return function(option) {
            const shadowRoot = original.call(this, option);
            if (this.shadowRoot && inDom(this))
              manager.addShadowRoot(this.shadowRoot, doc);
            return shadowRoot;
          };
        }
      )
    );
  }
  reset() {
    this.restoreHandlers.forEach((handler) => {
      try {
        handler();
      } catch (e2) {
      }
    });
    this.restoreHandlers = [];
    this.shadowDoms = /* @__PURE__ */ new WeakSet();
    this.bypassOptions.canvasManager.resetShadowRoots();
  }
}
class StylesheetManager {
  constructor(options) {
    this.trackedLinkElements = /* @__PURE__ */ new WeakSet();
    this.styleMirror = new StyleSheetMirror();
    this.mutationCb = options.mutationCb;
    this.adoptedStyleSheetCb = options.adoptedStyleSheetCb;
  }
  attachLinkElement(linkEl, childSn) {
    if ("_cssText" in childSn.attributes)
      this.mutationCb({
        adds: [],
        removes: [],
        texts: [],
        attributes: [
          {
            id: childSn.id,
            attributes: childSn.attributes
          }
        ]
      });
    this.trackLinkElement(linkEl);
  }
  trackLinkElement(linkEl) {
    if (this.trackedLinkElements.has(linkEl)) return;
    this.trackedLinkElements.add(linkEl);
    this.trackStylesheetInLinkElement(linkEl);
  }
  adoptStyleSheets(sheets, hostId) {
    if (sheets.length === 0) return;
    const adoptedStyleSheetData = {
      id: hostId,
      styleIds: []
    };
    const styles = [];
    for (const sheet of sheets) {
      let styleId;
      if (!this.styleMirror.has(sheet)) {
        styleId = this.styleMirror.add(sheet);
        styles.push({
          styleId,
          rules: Array.from(sheet.rules || CSSRule, (r2, index) => ({
            rule: stringifyRule(r2),
            index
          }))
        });
      } else styleId = this.styleMirror.getId(sheet);
      adoptedStyleSheetData.styleIds.push(styleId);
    }
    if (styles.length > 0) adoptedStyleSheetData.styles = styles;
    this.adoptedStyleSheetCb(adoptedStyleSheetData);
  }
  reset() {
    this.styleMirror.reset();
    this.trackedLinkElements = /* @__PURE__ */ new WeakSet();
  }
  // TODO: take snapshot on stylesheet reload by applying event listener
  trackStylesheetInLinkElement(_linkEl) {
  }
}
class ProcessedNodeManager {
  constructor() {
    this.nodeMap = /* @__PURE__ */ new WeakMap();
    this.active = false;
  }
  inOtherBuffer(node, thisBuffer) {
    const buffers = this.nodeMap.get(node);
    return buffers && Array.from(buffers).some((buffer) => buffer !== thisBuffer);
  }
  add(node, buffer) {
    if (!this.active) {
      this.active = true;
      onRequestAnimationFrame$1(() => {
        this.nodeMap = /* @__PURE__ */ new WeakMap();
        this.active = false;
      });
    }
    this.nodeMap.set(node, (this.nodeMap.get(node) || /* @__PURE__ */ new Set()).add(buffer));
  }
  destroy() {
  }
}
let wrappedEmit;
let _takeFullSnapshot;
try {
  if (Array.from([1], (x2) => x2 * 2)[0] !== 2) {
    const cleanFrame = document.createElement("iframe");
    document.body.appendChild(cleanFrame);
    Array.from = cleanFrame.contentWindow?.Array.from || Array.from;
    document.body.removeChild(cleanFrame);
  }
} catch (err) {
  console.debug("Unable to override Array.from", err);
}
const mirror = createMirror$1();
function record(options = {}) {
  const {
    emit,
    checkoutEveryNms,
    checkoutEveryNth,
    blockClass = "rr-block",
    blockSelector = null,
    unblockSelector = null,
    ignoreClass = "rr-ignore",
    ignoreSelector = null,
    maskAllText = false,
    maskTextClass = "rr-mask",
    unmaskTextClass = null,
    maskTextSelector = null,
    unmaskTextSelector = null,
    inlineStylesheet = true,
    maskAllInputs,
    maskInputOptions: _maskInputOptions,
    slimDOMOptions: _slimDOMOptions,
    maskAttributeFn,
    maskInputFn,
    maskTextFn,
    maxCanvasSize = null,
    packFn,
    sampling = {},
    dataURLOptions = {},
    mousemoveWait,
    recordDOM = true,
    recordCanvas = false,
    recordCrossOriginIframes = false,
    recordAfter = options.recordAfter === "DOMContentLoaded" ? options.recordAfter : "load",
    userTriggeredOnInput = false,
    collectFonts = false,
    inlineImages = false,
    plugins,
    keepIframeSrcFn = () => false,
    ignoreCSSAttributes = /* @__PURE__ */ new Set([]),
    errorHandler: errorHandler2,
    onMutation,
    getCanvasManager
  } = options;
  registerErrorHandler$1(errorHandler2);
  const inEmittingFrame = recordCrossOriginIframes ? window.parent === window : true;
  let passEmitsToParent = false;
  if (!inEmittingFrame) {
    try {
      if (window.parent.document) {
        passEmitsToParent = false;
      }
    } catch (e2) {
      passEmitsToParent = true;
    }
  }
  if (inEmittingFrame && !emit) {
    throw new Error("emit function is required");
  }
  if (!inEmittingFrame && !passEmitsToParent) {
    return () => {
    };
  }
  if (mousemoveWait !== void 0 && sampling.mousemove === void 0) {
    sampling.mousemove = mousemoveWait;
  }
  mirror.reset();
  const maskInputOptions = maskAllInputs === true ? {
    color: true,
    date: true,
    "datetime-local": true,
    email: true,
    month: true,
    number: true,
    range: true,
    search: true,
    tel: true,
    text: true,
    time: true,
    url: true,
    week: true,
    textarea: true,
    select: true,
    radio: true,
    checkbox: true
  } : _maskInputOptions !== void 0 ? _maskInputOptions : {};
  const slimDOMOptions = _slimDOMOptions === true || _slimDOMOptions === "all" ? {
    script: true,
    comment: true,
    headFavicon: true,
    headWhitespace: true,
    headMetaSocial: true,
    headMetaRobots: true,
    headMetaHttpEquiv: true,
    headMetaVerification: true,
    // the following are off for slimDOMOptions === true,
    // as they destroy some (hidden) info:
    headMetaAuthorship: _slimDOMOptions === "all",
    headMetaDescKeywords: _slimDOMOptions === "all"
  } : _slimDOMOptions ? _slimDOMOptions : {};
  polyfill();
  let lastFullSnapshotEvent;
  let incrementalSnapshotCount = 0;
  const eventProcessor = (e2) => {
    for (const plugin of plugins || []) {
      if (plugin.eventProcessor) {
        e2 = plugin.eventProcessor(e2);
      }
    }
    if (packFn && // Disable packing events which will be emitted to parent frames.
    !passEmitsToParent) {
      e2 = packFn(e2);
    }
    return e2;
  };
  wrappedEmit = (r2, isCheckout) => {
    const e2 = r2;
    e2.timestamp = nowTimestamp();
    if (mutationBuffers[0]?.isFrozen() && e2.type !== EventType.FullSnapshot && !(e2.type === EventType.IncrementalSnapshot && e2.data.source === IncrementalSource.Mutation)) {
      mutationBuffers.forEach((buf) => buf.unfreeze());
    }
    if (inEmittingFrame) {
      emit?.(eventProcessor(e2), isCheckout);
    } else if (passEmitsToParent) {
      const message = {
        type: "rrweb",
        event: eventProcessor(e2),
        origin: window.location.origin,
        isCheckout
      };
      window.parent.postMessage(message, "*");
    }
    if (e2.type === EventType.FullSnapshot) {
      lastFullSnapshotEvent = e2;
      incrementalSnapshotCount = 0;
    } else if (e2.type === EventType.IncrementalSnapshot) {
      if (e2.data.source === IncrementalSource.Mutation && e2.data.isAttachIframe) {
        return;
      }
      incrementalSnapshotCount++;
      const exceedCount = checkoutEveryNth && incrementalSnapshotCount >= checkoutEveryNth;
      const exceedTime = checkoutEveryNms && lastFullSnapshotEvent && e2.timestamp - lastFullSnapshotEvent.timestamp > checkoutEveryNms;
      if (exceedCount || exceedTime) {
        takeFullSnapshot2(true);
      }
    }
  };
  const wrappedMutationEmit = (m2) => {
    wrappedEmit({
      type: EventType.IncrementalSnapshot,
      data: {
        source: IncrementalSource.Mutation,
        ...m2
      }
    });
  };
  const wrappedScrollEmit = (p2) => wrappedEmit({
    type: EventType.IncrementalSnapshot,
    data: {
      source: IncrementalSource.Scroll,
      ...p2
    }
  });
  const wrappedCanvasMutationEmit = (p2) => wrappedEmit({
    type: EventType.IncrementalSnapshot,
    data: {
      source: IncrementalSource.CanvasMutation,
      ...p2
    }
  });
  const wrappedAdoptedStyleSheetEmit = (a2) => wrappedEmit({
    type: EventType.IncrementalSnapshot,
    data: {
      source: IncrementalSource.AdoptedStyleSheet,
      ...a2
    }
  });
  const stylesheetManager = new StylesheetManager({
    mutationCb: wrappedMutationEmit,
    adoptedStyleSheetCb: wrappedAdoptedStyleSheetEmit
  });
  const iframeManager = typeof __RRWEB_EXCLUDE_IFRAME__ === "boolean" && __RRWEB_EXCLUDE_IFRAME__ ? new IframeManagerNoop() : new IframeManager({
    mirror,
    mutationCb: wrappedMutationEmit,
    stylesheetManager,
    recordCrossOriginIframes,
    wrappedEmit
  });
  for (const plugin of plugins || []) {
    if (plugin.getMirror)
      plugin.getMirror({
        nodeMirror: mirror,
        crossOriginIframeMirror: iframeManager.crossOriginIframeMirror,
        crossOriginIframeStyleMirror: iframeManager.crossOriginIframeStyleMirror
      });
  }
  const processedNodeManager = new ProcessedNodeManager();
  const canvasManager = _getCanvasManager(
    getCanvasManager,
    {
      mirror,
      win: window,
      mutationCb: (p2) => wrappedEmit({
        type: EventType.IncrementalSnapshot,
        data: {
          source: IncrementalSource.CanvasMutation,
          ...p2
        }
      }),
      recordCanvas,
      blockClass,
      blockSelector,
      unblockSelector,
      maxCanvasSize,
      sampling: sampling["canvas"],
      dataURLOptions,
      errorHandler: errorHandler2
    }
  );
  const shadowDomManager = typeof __RRWEB_EXCLUDE_SHADOW_DOM__ === "boolean" && __RRWEB_EXCLUDE_SHADOW_DOM__ ? new ShadowDomManagerNoop() : new ShadowDomManager({
    mutationCb: wrappedMutationEmit,
    scrollCb: wrappedScrollEmit,
    bypassOptions: {
      onMutation,
      blockClass,
      blockSelector,
      unblockSelector,
      maskAllText,
      maskTextClass,
      unmaskTextClass,
      maskTextSelector,
      unmaskTextSelector,
      inlineStylesheet,
      maskInputOptions,
      dataURLOptions,
      maskAttributeFn,
      maskTextFn,
      maskInputFn,
      recordCanvas,
      inlineImages,
      sampling,
      slimDOMOptions,
      iframeManager,
      stylesheetManager,
      canvasManager,
      keepIframeSrcFn,
      processedNodeManager,
      ignoreCSSAttributes
    },
    mirror
  });
  const takeFullSnapshot2 = (isCheckout = false) => {
    if (!recordDOM) {
      return;
    }
    wrappedEmit(
      {
        type: EventType.Meta,
        data: {
          href: window.location.href,
          width: getWindowWidth(),
          height: getWindowHeight()
        }
      },
      isCheckout
    );
    stylesheetManager.reset();
    shadowDomManager.init();
    mutationBuffers.forEach((buf) => buf.lock());
    const node = snapshot(document, {
      mirror,
      blockClass,
      blockSelector,
      unblockSelector,
      maskAllText,
      maskTextClass,
      unmaskTextClass,
      maskTextSelector,
      unmaskTextSelector,
      inlineStylesheet,
      maskAllInputs: maskInputOptions,
      maskAttributeFn,
      maskInputFn,
      maskTextFn,
      slimDOM: slimDOMOptions,
      dataURLOptions,
      recordCanvas,
      inlineImages,
      onSerialize: (n2) => {
        if (isSerializedIframe(n2, mirror)) {
          iframeManager.addIframe(n2);
        }
        if (isSerializedStylesheet(n2, mirror)) {
          stylesheetManager.trackLinkElement(n2);
        }
        if (hasShadowRoot(n2)) {
          shadowDomManager.addShadowRoot(n2.shadowRoot, document);
        }
      },
      onIframeLoad: (iframe, childSn) => {
        iframeManager.attachIframe(iframe, childSn);
        const contentWindow = getIFrameContentWindow(iframe);
        if (contentWindow) {
          canvasManager.addWindow(contentWindow);
        }
        shadowDomManager.observeAttachShadow(iframe);
      },
      onStylesheetLoad: (linkEl, childSn) => {
        stylesheetManager.attachLinkElement(linkEl, childSn);
      },
      onBlockedImageLoad: (_imageEl, serializedNode, { width, height }) => {
        wrappedMutationEmit({
          adds: [],
          removes: [],
          texts: [],
          attributes: [
            {
              id: serializedNode.id,
              attributes: {
                style: {
                  width: `${width}px`,
                  height: `${height}px`
                }
              }
            }
          ]
        });
      },
      keepIframeSrcFn,
      ignoreCSSAttributes
    });
    if (!node) {
      return console.warn("Failed to snapshot the document");
    }
    wrappedEmit({
      type: EventType.FullSnapshot,
      data: {
        node,
        initialOffset: getWindowScroll(window)
      }
    });
    mutationBuffers.forEach((buf) => buf.unlock());
    if (document.adoptedStyleSheets && document.adoptedStyleSheets.length > 0)
      stylesheetManager.adoptStyleSheets(
        document.adoptedStyleSheets,
        mirror.getId(document)
      );
  };
  _takeFullSnapshot = takeFullSnapshot2;
  try {
    const handlers2 = [];
    const observe2 = (doc) => {
      return callbackWrapper$1(initObservers)(
        {
          onMutation,
          mutationCb: wrappedMutationEmit,
          mousemoveCb: (positions, source) => wrappedEmit({
            type: EventType.IncrementalSnapshot,
            data: {
              source,
              positions
            }
          }),
          mouseInteractionCb: (d2) => wrappedEmit({
            type: EventType.IncrementalSnapshot,
            data: {
              source: IncrementalSource.MouseInteraction,
              ...d2
            }
          }),
          scrollCb: wrappedScrollEmit,
          viewportResizeCb: (d2) => wrappedEmit({
            type: EventType.IncrementalSnapshot,
            data: {
              source: IncrementalSource.ViewportResize,
              ...d2
            }
          }),
          inputCb: (v2) => wrappedEmit({
            type: EventType.IncrementalSnapshot,
            data: {
              source: IncrementalSource.Input,
              ...v2
            }
          }),
          mediaInteractionCb: (p2) => wrappedEmit({
            type: EventType.IncrementalSnapshot,
            data: {
              source: IncrementalSource.MediaInteraction,
              ...p2
            }
          }),
          styleSheetRuleCb: (r2) => wrappedEmit({
            type: EventType.IncrementalSnapshot,
            data: {
              source: IncrementalSource.StyleSheetRule,
              ...r2
            }
          }),
          styleDeclarationCb: (r2) => wrappedEmit({
            type: EventType.IncrementalSnapshot,
            data: {
              source: IncrementalSource.StyleDeclaration,
              ...r2
            }
          }),
          canvasMutationCb: wrappedCanvasMutationEmit,
          fontCb: (p2) => wrappedEmit({
            type: EventType.IncrementalSnapshot,
            data: {
              source: IncrementalSource.Font,
              ...p2
            }
          }),
          selectionCb: (p2) => {
            wrappedEmit({
              type: EventType.IncrementalSnapshot,
              data: {
                source: IncrementalSource.Selection,
                ...p2
              }
            });
          },
          customElementCb: (c2) => {
            wrappedEmit({
              type: EventType.IncrementalSnapshot,
              data: {
                source: IncrementalSource.CustomElement,
                ...c2
              }
            });
          },
          blockClass,
          ignoreClass,
          ignoreSelector,
          maskAllText,
          maskTextClass,
          unmaskTextClass,
          maskTextSelector,
          unmaskTextSelector,
          maskInputOptions,
          inlineStylesheet,
          sampling,
          recordDOM,
          recordCanvas,
          inlineImages,
          userTriggeredOnInput,
          collectFonts,
          doc,
          maskAttributeFn,
          maskInputFn,
          maskTextFn,
          keepIframeSrcFn,
          blockSelector,
          unblockSelector,
          slimDOMOptions,
          dataURLOptions,
          mirror,
          iframeManager,
          stylesheetManager,
          shadowDomManager,
          processedNodeManager,
          canvasManager,
          ignoreCSSAttributes,
          plugins: plugins?.filter((p2) => p2.observer)?.map((p2) => ({
            observer: p2.observer,
            options: p2.options,
            callback: (payload) => wrappedEmit({
              type: EventType.Plugin,
              data: {
                plugin: p2.name,
                payload
              }
            })
          })) || []
        },
        {}
      );
    };
    iframeManager.addLoadListener((iframeEl) => {
      try {
        handlers2.push(observe2(iframeEl.contentDocument));
      } catch (error2) {
        console.warn(error2);
      }
    });
    const init2 = () => {
      takeFullSnapshot2();
      handlers2.push(observe2(document));
    };
    if (document.readyState === "interactive" || document.readyState === "complete") {
      init2();
    } else {
      handlers2.push(
        on("DOMContentLoaded", () => {
          wrappedEmit({
            type: EventType.DomContentLoaded,
            data: {}
          });
          if (recordAfter === "DOMContentLoaded") init2();
        })
      );
      handlers2.push(
        on(
          "load",
          () => {
            wrappedEmit({
              type: EventType.Load,
              data: {}
            });
            if (recordAfter === "load") init2();
          },
          window
        )
      );
    }
    return () => {
      handlers2.forEach((h2) => h2());
      processedNodeManager.destroy();
      _takeFullSnapshot = void 0;
      unregisterErrorHandler();
    };
  } catch (error2) {
    console.warn(error2);
  }
}
function takeFullSnapshot(isCheckout) {
  if (!_takeFullSnapshot) {
    throw new Error("please take full snapshot after start recording");
  }
  _takeFullSnapshot(isCheckout);
}
record.mirror = mirror;
record.takeFullSnapshot = takeFullSnapshot;
function _getCanvasManager(getCanvasManagerFn, options) {
  try {
    return getCanvasManagerFn ? getCanvasManagerFn(options) : new CanvasManagerNoop();
  } catch {
    console.warn("Unable to initialize CanvasManager");
    return new CanvasManagerNoop();
  }
}
var n$1;
!(function(t2) {
  t2[t2.NotStarted = 0] = "NotStarted", t2[t2.Running = 1] = "Running", t2[t2.Stopped = 2] = "Stopped";
})(n$1 || (n$1 = {}));
const ReplayEventTypeIncrementalSnapshot = 3;
const ReplayEventTypeCustom = 5;
function timestampToMs(timestamp) {
  const isMs = timestamp > 9999999999;
  return isMs ? timestamp : timestamp * 1e3;
}
function timestampToS(timestamp) {
  const isMs = timestamp > 9999999999;
  return isMs ? timestamp / 1e3 : timestamp;
}
function addBreadcrumbEvent(replay, breadcrumb) {
  if (breadcrumb.category === "sentry.transaction") {
    return;
  }
  if (["ui.click", "ui.input"].includes(breadcrumb.category)) {
    replay.triggerUserActivity();
  } else {
    replay.checkAndHandleExpiredSession();
  }
  replay.addUpdate(() => {
    replay.throttledAddEvent({
      type: EventType.Custom,
      // TODO: We were converting from ms to seconds for breadcrumbs, spans,
      // but maybe we should just keep them as milliseconds
      timestamp: (breadcrumb.timestamp || 0) * 1e3,
      data: {
        tag: "breadcrumb",
        // normalize to max. 10 depth and 1_000 properties per object
        payload: normalize(breadcrumb, 10, 1e3)
      }
    });
    return breadcrumb.category === "console";
  });
}
const INTERACTIVE_SELECTOR = "button,a";
function getClosestInteractive(element) {
  const closestInteractive = element.closest(INTERACTIVE_SELECTOR);
  return closestInteractive || element;
}
function getClickTargetNode(event) {
  const target = getTargetNode(event);
  if (!target || !(target instanceof Element)) {
    return target;
  }
  return getClosestInteractive(target);
}
function getTargetNode(event) {
  if (isEventWithTarget(event)) {
    return event.target;
  }
  return event;
}
function isEventWithTarget(event) {
  return typeof event === "object" && !!event && "target" in event;
}
let handlers;
function onWindowOpen(cb) {
  if (!handlers) {
    handlers = [];
    monkeyPatchWindowOpen();
  }
  handlers.push(cb);
  return () => {
    const pos = handlers ? handlers.indexOf(cb) : -1;
    if (pos > -1) {
      handlers.splice(pos, 1);
    }
  };
}
function monkeyPatchWindowOpen() {
  fill(WINDOW, "open", function(originalWindowOpen) {
    return function(...args) {
      if (handlers) {
        try {
          handlers.forEach((handler) => handler());
        } catch {
        }
      }
      return originalWindowOpen.apply(WINDOW, args);
    };
  });
}
const IncrementalMutationSources = /* @__PURE__ */ new Set([
  IncrementalSource.Mutation,
  IncrementalSource.StyleSheetRule,
  IncrementalSource.StyleDeclaration,
  IncrementalSource.AdoptedStyleSheet,
  IncrementalSource.CanvasMutation,
  IncrementalSource.Selection,
  IncrementalSource.MediaInteraction
]);
function handleClick(clickDetector, clickBreadcrumb, node) {
  clickDetector.handleClick(clickBreadcrumb, node);
}
class ClickDetector {
  constructor(replay, slowClickConfig, _addBreadcrumbEvent = addBreadcrumbEvent) {
    this._lastMutation = 0;
    this._lastScroll = 0;
    this._clicks = [];
    this._timeout = slowClickConfig.timeout / 1e3;
    this._threshold = slowClickConfig.threshold / 1e3;
    this._scrollTimeout = slowClickConfig.scrollTimeout / 1e3;
    this._replay = replay;
    this._ignoreSelector = slowClickConfig.ignoreSelector;
    this._addBreadcrumbEvent = _addBreadcrumbEvent;
  }
  /** Register click detection handlers on mutation or scroll. */
  addListeners() {
    const cleanupWindowOpen = onWindowOpen(() => {
      this._lastMutation = nowInSeconds();
    });
    this._teardown = () => {
      cleanupWindowOpen();
      this._clicks = [];
      this._lastMutation = 0;
      this._lastScroll = 0;
    };
  }
  /** Clean up listeners. */
  removeListeners() {
    if (this._teardown) {
      this._teardown();
    }
    if (this._checkClickTimeout) {
      clearTimeout(this._checkClickTimeout);
    }
  }
  /** @inheritDoc */
  handleClick(breadcrumb, node) {
    if (ignoreElement(node, this._ignoreSelector) || !isClickBreadcrumb(breadcrumb)) {
      return;
    }
    const newClick = {
      timestamp: timestampToS(breadcrumb.timestamp),
      clickBreadcrumb: breadcrumb,
      // Set this to 0 so we know it originates from the click breadcrumb
      clickCount: 0,
      node
    };
    if (this._clicks.some((click) => click.node === newClick.node && Math.abs(click.timestamp - newClick.timestamp) < 1)) {
      return;
    }
    this._clicks.push(newClick);
    if (this._clicks.length === 1) {
      this._scheduleCheckClicks();
    }
  }
  /** @inheritDoc */
  registerMutation(timestamp = Date.now()) {
    this._lastMutation = timestampToS(timestamp);
  }
  /** @inheritDoc */
  registerScroll(timestamp = Date.now()) {
    this._lastScroll = timestampToS(timestamp);
  }
  /** @inheritDoc */
  registerClick(element) {
    const node = getClosestInteractive(element);
    this._handleMultiClick(node);
  }
  /** Count multiple clicks on elements. */
  _handleMultiClick(node) {
    this._getClicks(node).forEach((click) => {
      click.clickCount++;
    });
  }
  /** Get all pending clicks for a given node. */
  _getClicks(node) {
    return this._clicks.filter((click) => click.node === node);
  }
  /** Check the clicks that happened. */
  _checkClicks() {
    const timedOutClicks = [];
    const now = nowInSeconds();
    this._clicks.forEach((click) => {
      if (!click.mutationAfter && this._lastMutation) {
        click.mutationAfter = click.timestamp <= this._lastMutation ? this._lastMutation - click.timestamp : void 0;
      }
      if (!click.scrollAfter && this._lastScroll) {
        click.scrollAfter = click.timestamp <= this._lastScroll ? this._lastScroll - click.timestamp : void 0;
      }
      if (click.timestamp + this._timeout <= now) {
        timedOutClicks.push(click);
      }
    });
    for (const click of timedOutClicks) {
      const pos = this._clicks.indexOf(click);
      if (pos > -1) {
        this._generateBreadcrumbs(click);
        this._clicks.splice(pos, 1);
      }
    }
    if (this._clicks.length) {
      this._scheduleCheckClicks();
    }
  }
  /** Generate matching breadcrumb(s) for the click. */
  _generateBreadcrumbs(click) {
    const replay = this._replay;
    const hadScroll = click.scrollAfter && click.scrollAfter <= this._scrollTimeout;
    const hadMutation = click.mutationAfter && click.mutationAfter <= this._threshold;
    const isSlowClick = !hadScroll && !hadMutation;
    const { clickCount, clickBreadcrumb } = click;
    if (isSlowClick) {
      const timeAfterClickMs = Math.min(click.mutationAfter || this._timeout, this._timeout) * 1e3;
      const endReason = timeAfterClickMs < this._timeout * 1e3 ? "mutation" : "timeout";
      const breadcrumb = {
        type: "default",
        message: clickBreadcrumb.message,
        timestamp: clickBreadcrumb.timestamp,
        category: "ui.slowClickDetected",
        data: {
          ...clickBreadcrumb.data,
          url: WINDOW.location.href,
          route: replay.getCurrentRoute(),
          timeAfterClickMs,
          endReason,
          // If clickCount === 0, it means multiClick was not correctly captured here
          // - we still want to send 1 in this case
          clickCount: clickCount || 1
        }
      };
      this._addBreadcrumbEvent(replay, breadcrumb);
      return;
    }
    if (clickCount > 1) {
      const breadcrumb = {
        type: "default",
        message: clickBreadcrumb.message,
        timestamp: clickBreadcrumb.timestamp,
        category: "ui.multiClick",
        data: {
          ...clickBreadcrumb.data,
          url: WINDOW.location.href,
          route: replay.getCurrentRoute(),
          clickCount,
          metric: true
        }
      };
      this._addBreadcrumbEvent(replay, breadcrumb);
    }
  }
  /** Schedule to check current clicks. */
  _scheduleCheckClicks() {
    if (this._checkClickTimeout) {
      clearTimeout(this._checkClickTimeout);
    }
    this._checkClickTimeout = setTimeout$3(() => this._checkClicks(), 1e3);
  }
}
const SLOW_CLICK_TAGS = ["A", "BUTTON", "INPUT"];
function ignoreElement(node, ignoreSelector) {
  if (!SLOW_CLICK_TAGS.includes(node.tagName)) {
    return true;
  }
  if (node.tagName === "INPUT" && !["submit", "button"].includes(node.getAttribute("type") || "")) {
    return true;
  }
  if (node.tagName === "A" && (node.hasAttribute("download") || node.hasAttribute("target") && node.getAttribute("target") !== "_self")) {
    return true;
  }
  if (ignoreSelector && node.matches(ignoreSelector)) {
    return true;
  }
  return false;
}
function isClickBreadcrumb(breadcrumb) {
  return !!(breadcrumb.data && typeof breadcrumb.data.nodeId === "number" && breadcrumb.timestamp);
}
function nowInSeconds() {
  return Date.now() / 1e3;
}
function updateClickDetectorForRecordingEvent(clickDetector, event) {
  try {
    if (!isIncrementalEvent(event)) {
      return;
    }
    const { source } = event.data;
    if (IncrementalMutationSources.has(source)) {
      clickDetector.registerMutation(event.timestamp);
    }
    if (source === IncrementalSource.Scroll) {
      clickDetector.registerScroll(event.timestamp);
    }
    if (isIncrementalMouseInteraction(event)) {
      const { type, id } = event.data;
      const node = record.mirror.getNode(id);
      if (node instanceof HTMLElement && type === MouseInteractions.Click) {
        clickDetector.registerClick(node);
      }
    }
  } catch {
  }
}
function isIncrementalEvent(event) {
  return event.type === ReplayEventTypeIncrementalSnapshot;
}
function isIncrementalMouseInteraction(event) {
  return event.data.source === IncrementalSource.MouseInteraction;
}
function createBreadcrumb(breadcrumb) {
  return {
    timestamp: Date.now() / 1e3,
    type: "default",
    ...breadcrumb
  };
}
var NodeType = /* @__PURE__ */ ((NodeType2) => {
  NodeType2[NodeType2["Document"] = 0] = "Document";
  NodeType2[NodeType2["DocumentType"] = 1] = "DocumentType";
  NodeType2[NodeType2["Element"] = 2] = "Element";
  NodeType2[NodeType2["Text"] = 3] = "Text";
  NodeType2[NodeType2["CDATA"] = 4] = "CDATA";
  NodeType2[NodeType2["Comment"] = 5] = "Comment";
  return NodeType2;
})(NodeType || {});
const ATTRIBUTES_TO_RECORD = /* @__PURE__ */ new Set([
  "id",
  "class",
  "aria-label",
  "role",
  "name",
  "alt",
  "title",
  "data-test-id",
  "data-testid",
  "disabled",
  "aria-disabled",
  "data-sentry-component"
]);
function getAttributesToRecord(attributes) {
  const obj = {};
  if (!attributes["data-sentry-component"] && attributes["data-sentry-element"]) {
    attributes["data-sentry-component"] = attributes["data-sentry-element"];
  }
  for (const key in attributes) {
    if (ATTRIBUTES_TO_RECORD.has(key)) {
      let normalizedKey = key;
      if (key === "data-testid" || key === "data-test-id") {
        normalizedKey = "testId";
      }
      obj[normalizedKey] = attributes[key];
    }
  }
  return obj;
}
const handleDomListener = (replay) => {
  return (handlerData) => {
    if (!replay.isEnabled()) {
      return;
    }
    const result = handleDom(handlerData);
    if (!result) {
      return;
    }
    const isClick = handlerData.name === "click";
    const event = isClick ? handlerData.event : void 0;
    if (isClick && replay.clickDetector && event?.target && !event.altKey && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
      handleClick(
        replay.clickDetector,
        result,
        getClickTargetNode(handlerData.event)
      );
    }
    addBreadcrumbEvent(replay, result);
  };
};
function getBaseDomBreadcrumb(target, message) {
  const nodeId = record.mirror.getId(target);
  const node = nodeId && record.mirror.getNode(nodeId);
  const meta = node && record.mirror.getMeta(node);
  const element = meta && isElement(meta) ? meta : null;
  return {
    message,
    data: element ? {
      nodeId,
      node: {
        id: nodeId,
        tagName: element.tagName,
        textContent: Array.from(element.childNodes).map((node2) => node2.type === NodeType.Text && node2.textContent).filter(Boolean).map((text) => text.trim()).join(""),
        attributes: getAttributesToRecord(element.attributes)
      }
    } : {}
  };
}
function handleDom(handlerData) {
  const { target, message } = getDomTarget(handlerData);
  return createBreadcrumb({
    category: `ui.${handlerData.name}`,
    ...getBaseDomBreadcrumb(target, message)
  });
}
function getDomTarget(handlerData) {
  const isClick = handlerData.name === "click";
  let message;
  let target = null;
  try {
    target = isClick ? getClickTargetNode(handlerData.event) : getTargetNode(handlerData.event);
    message = htmlTreeAsString(target, { maxStringLength: 200 }) || "<unknown>";
  } catch {
    message = "<unknown>";
  }
  return { target, message };
}
function isElement(node) {
  return node.type === NodeType.Element;
}
function handleKeyboardEvent(replay, event) {
  if (!replay.isEnabled()) {
    return;
  }
  replay.updateUserActivity();
  const breadcrumb = getKeyboardBreadcrumb(event);
  if (!breadcrumb) {
    return;
  }
  addBreadcrumbEvent(replay, breadcrumb);
}
function getKeyboardBreadcrumb(event) {
  const { metaKey, shiftKey, ctrlKey, altKey, key, target } = event;
  if (!target || isInputElement(target) || !key) {
    return null;
  }
  const hasModifierKey = metaKey || ctrlKey || altKey;
  const isCharacterKey = key.length === 1;
  if (!hasModifierKey && isCharacterKey) {
    return null;
  }
  const message = htmlTreeAsString(target, { maxStringLength: 200 }) || "<unknown>";
  const baseBreadcrumb = getBaseDomBreadcrumb(target, message);
  return createBreadcrumb({
    category: "ui.keyDown",
    message,
    data: {
      ...baseBreadcrumb.data,
      metaKey,
      shiftKey,
      ctrlKey,
      altKey,
      key
    }
  });
}
function isInputElement(target) {
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
}
const ENTRY_TYPES = {
  // @ts-expect-error TODO: entry type does not fit the create* functions entry type
  resource: createResourceEntry,
  paint: createPaintEntry,
  // @ts-expect-error TODO: entry type does not fit the create* functions entry type
  navigation: createNavigationEntry
};
function webVitalHandler(getter, replay) {
  return ({ metric }) => void replay.replayPerformanceEntries.push(getter(metric));
}
function createPerformanceEntries(entries) {
  return entries.map(createPerformanceEntry).filter(Boolean);
}
function createPerformanceEntry(entry) {
  const entryType = ENTRY_TYPES[entry.entryType];
  if (!entryType) {
    return null;
  }
  return entryType(entry);
}
function getAbsoluteTime(time) {
  return ((browserPerformanceTimeOrigin() || WINDOW.performance.timeOrigin) + time) / 1e3;
}
function createPaintEntry(entry) {
  const { duration, entryType, name, startTime } = entry;
  const start = getAbsoluteTime(startTime);
  return {
    type: entryType,
    name,
    start,
    end: start + duration,
    data: void 0
  };
}
function createNavigationEntry(entry) {
  const {
    entryType,
    name,
    decodedBodySize,
    duration,
    domComplete,
    encodedBodySize,
    domContentLoadedEventStart,
    domContentLoadedEventEnd,
    domInteractive,
    loadEventStart,
    loadEventEnd,
    redirectCount,
    startTime,
    transferSize,
    type
  } = entry;
  if (duration === 0) {
    return null;
  }
  return {
    type: `${entryType}.${type}`,
    start: getAbsoluteTime(startTime),
    end: getAbsoluteTime(domComplete),
    name,
    data: {
      size: transferSize,
      decodedBodySize,
      encodedBodySize,
      duration,
      domInteractive,
      domContentLoadedEventStart,
      domContentLoadedEventEnd,
      loadEventStart,
      loadEventEnd,
      domComplete,
      redirectCount
    }
  };
}
function createResourceEntry(entry) {
  const {
    entryType,
    initiatorType,
    name,
    responseEnd,
    startTime,
    decodedBodySize,
    encodedBodySize,
    responseStatus,
    transferSize
  } = entry;
  if (["fetch", "xmlhttprequest"].includes(initiatorType)) {
    return null;
  }
  return {
    type: `${entryType}.${initiatorType}`,
    start: getAbsoluteTime(startTime),
    end: getAbsoluteTime(responseEnd),
    name,
    data: {
      size: transferSize,
      statusCode: responseStatus,
      decodedBodySize,
      encodedBodySize
    }
  };
}
function getLargestContentfulPaint(metric) {
  const lastEntry = metric.entries[metric.entries.length - 1];
  const node = lastEntry?.element ? [lastEntry.element] : void 0;
  return getWebVital(metric, "largest-contentful-paint", node);
}
function isLayoutShift(entry) {
  return entry.sources !== void 0;
}
function getCumulativeLayoutShift(metric) {
  const layoutShifts = [];
  const nodes = [];
  for (const entry of metric.entries) {
    if (isLayoutShift(entry)) {
      const nodeIds = [];
      for (const source of entry.sources) {
        if (source.node) {
          nodes.push(source.node);
          const nodeId = record.mirror.getId(source.node);
          if (nodeId) {
            nodeIds.push(nodeId);
          }
        }
      }
      layoutShifts.push({ value: entry.value, nodeIds: nodeIds.length ? nodeIds : void 0 });
    }
  }
  return getWebVital(metric, "cumulative-layout-shift", nodes, layoutShifts);
}
function getInteractionToNextPaint(metric) {
  const lastEntry = metric.entries[metric.entries.length - 1];
  const node = lastEntry?.target ? [lastEntry.target] : void 0;
  return getWebVital(metric, "interaction-to-next-paint", node);
}
function getWebVital(metric, name, nodes, attributions) {
  const value = metric.value;
  const rating = metric.rating;
  const end = getAbsoluteTime(value);
  return {
    type: "web-vital",
    name,
    start: end,
    end,
    data: {
      value,
      size: value,
      rating,
      nodeIds: nodes ? nodes.map((node) => record.mirror.getId(node)) : void 0,
      attributions
    }
  };
}
function setupPerformanceObserver(replay) {
  function addPerformanceEntry(entry) {
    if (!replay.performanceEntries.includes(entry)) {
      replay.performanceEntries.push(entry);
    }
  }
  function onEntries({ entries }) {
    entries.forEach(addPerformanceEntry);
  }
  const clearCallbacks = [];
  ["navigation", "paint", "resource"].forEach((type) => {
    clearCallbacks.push(addPerformanceInstrumentationHandler(type, onEntries));
  });
  clearCallbacks.push(
    addLcpInstrumentationHandler(webVitalHandler(getLargestContentfulPaint, replay)),
    addClsInstrumentationHandler(webVitalHandler(getCumulativeLayoutShift, replay)),
    addInpInstrumentationHandler(webVitalHandler(getInteractionToNextPaint, replay))
  );
  return () => {
    clearCallbacks.forEach((clearCallback) => clearCallback());
  };
}
const DEBUG_BUILD$1 = typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__;
const r$1 = `var t=Uint8Array,n=Uint16Array,r=Int32Array,e=new t([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),i=new t([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),s=new t([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),a=function(t,e){for(var i=new n(31),s=0;s<31;++s)i[s]=e+=1<<t[s-1];var a=new r(i[30]);for(s=1;s<30;++s)for(var o=i[s];o<i[s+1];++o)a[o]=o-i[s]<<5|s;return{b:i,r:a}},o=a(e,2),h=o.b,f=o.r;h[28]=258,f[258]=28;for(var l=a(i,0).r,u=new n(32768),c=0;c<32768;++c){var v=(43690&c)>>1|(21845&c)<<1;v=(61680&(v=(52428&v)>>2|(13107&v)<<2))>>4|(3855&v)<<4,u[c]=((65280&v)>>8|(255&v)<<8)>>1}var d=function(t,r,e){for(var i=t.length,s=0,a=new n(r);s<i;++s)t[s]&&++a[t[s]-1];var o,h=new n(r);for(s=1;s<r;++s)h[s]=h[s-1]+a[s-1]<<1;if(e){o=new n(1<<r);var f=15-r;for(s=0;s<i;++s)if(t[s])for(var l=s<<4|t[s],c=r-t[s],v=h[t[s]-1]++<<c,d=v|(1<<c)-1;v<=d;++v)o[u[v]>>f]=l}else for(o=new n(i),s=0;s<i;++s)t[s]&&(o[s]=u[h[t[s]-1]++]>>15-t[s]);return o},p=new t(288);for(c=0;c<144;++c)p[c]=8;for(c=144;c<256;++c)p[c]=9;for(c=256;c<280;++c)p[c]=7;for(c=280;c<288;++c)p[c]=8;var g=new t(32);for(c=0;c<32;++c)g[c]=5;var w=d(p,9,0),y=d(g,5,0),m=function(t){return(t+7)/8|0},b=function(n,r,e){return(null==e||e>n.length)&&(e=n.length),new t(n.subarray(r,e))},M=["unexpected EOF","invalid block type","invalid length/literal","invalid distance","stream finished","no stream handler",,"no callback","invalid UTF-8 data","extra field too long","date not in range 1980-2099","filename too long","stream finishing","invalid zip data"],E=function(t,n,r){var e=new Error(n||M[t]);if(e.code=t,Error.captureStackTrace&&Error.captureStackTrace(e,E),!r)throw e;return e},z=function(t,n,r){r<<=7&n;var e=n/8|0;t[e]|=r,t[e+1]|=r>>8},_=function(t,n,r){r<<=7&n;var e=n/8|0;t[e]|=r,t[e+1]|=r>>8,t[e+2]|=r>>16},x=function(r,e){for(var i=[],s=0;s<r.length;++s)r[s]&&i.push({s:s,f:r[s]});var a=i.length,o=i.slice();if(!a)return{t:F,l:0};if(1==a){var h=new t(i[0].s+1);return h[i[0].s]=1,{t:h,l:1}}i.sort(function(t,n){return t.f-n.f}),i.push({s:-1,f:25001});var f=i[0],l=i[1],u=0,c=1,v=2;for(i[0]={s:-1,f:f.f+l.f,l:f,r:l};c!=a-1;)f=i[i[u].f<i[v].f?u++:v++],l=i[u!=c&&i[u].f<i[v].f?u++:v++],i[c++]={s:-1,f:f.f+l.f,l:f,r:l};var d=o[0].s;for(s=1;s<a;++s)o[s].s>d&&(d=o[s].s);var p=new n(d+1),g=A(i[c-1],p,0);if(g>e){s=0;var w=0,y=g-e,m=1<<y;for(o.sort(function(t,n){return p[n.s]-p[t.s]||t.f-n.f});s<a;++s){var b=o[s].s;if(!(p[b]>e))break;w+=m-(1<<g-p[b]),p[b]=e}for(w>>=y;w>0;){var M=o[s].s;p[M]<e?w-=1<<e-p[M]++-1:++s}for(;s>=0&&w;--s){var E=o[s].s;p[E]==e&&(--p[E],++w)}g=e}return{t:new t(p),l:g}},A=function(t,n,r){return-1==t.s?Math.max(A(t.l,n,r+1),A(t.r,n,r+1)):n[t.s]=r},D=function(t){for(var r=t.length;r&&!t[--r];);for(var e=new n(++r),i=0,s=t[0],a=1,o=function(t){e[i++]=t},h=1;h<=r;++h)if(t[h]==s&&h!=r)++a;else{if(!s&&a>2){for(;a>138;a-=138)o(32754);a>2&&(o(a>10?a-11<<5|28690:a-3<<5|12305),a=0)}else if(a>3){for(o(s),--a;a>6;a-=6)o(8304);a>2&&(o(a-3<<5|8208),a=0)}for(;a--;)o(s);a=1,s=t[h]}return{c:e.subarray(0,i),n:r}},T=function(t,n){for(var r=0,e=0;e<n.length;++e)r+=t[e]*n[e];return r},k=function(t,n,r){var e=r.length,i=m(n+2);t[i]=255&e,t[i+1]=e>>8,t[i+2]=255^t[i],t[i+3]=255^t[i+1];for(var s=0;s<e;++s)t[i+s+4]=r[s];return 8*(i+4+e)},U=function(t,r,a,o,h,f,l,u,c,v,m){z(r,m++,a),++h[256];for(var b=x(h,15),M=b.t,E=b.l,A=x(f,15),U=A.t,C=A.l,F=D(M),I=F.c,S=F.n,L=D(U),O=L.c,j=L.n,q=new n(19),B=0;B<I.length;++B)++q[31&I[B]];for(B=0;B<O.length;++B)++q[31&O[B]];for(var G=x(q,7),H=G.t,J=G.l,K=19;K>4&&!H[s[K-1]];--K);var N,P,Q,R,V=v+5<<3,W=T(h,p)+T(f,g)+l,X=T(h,M)+T(f,U)+l+14+3*K+T(q,H)+2*q[16]+3*q[17]+7*q[18];if(c>=0&&V<=W&&V<=X)return k(r,m,t.subarray(c,c+v));if(z(r,m,1+(X<W)),m+=2,X<W){N=d(M,E,0),P=M,Q=d(U,C,0),R=U;var Y=d(H,J,0);z(r,m,S-257),z(r,m+5,j-1),z(r,m+10,K-4),m+=14;for(B=0;B<K;++B)z(r,m+3*B,H[s[B]]);m+=3*K;for(var Z=[I,O],$=0;$<2;++$){var tt=Z[$];for(B=0;B<tt.length;++B){var nt=31&tt[B];z(r,m,Y[nt]),m+=H[nt],nt>15&&(z(r,m,tt[B]>>5&127),m+=tt[B]>>12)}}}else N=w,P=p,Q=y,R=g;for(B=0;B<u;++B){var rt=o[B];if(rt>255){_(r,m,N[(nt=rt>>18&31)+257]),m+=P[nt+257],nt>7&&(z(r,m,rt>>23&31),m+=e[nt]);var et=31&rt;_(r,m,Q[et]),m+=R[et],et>3&&(_(r,m,rt>>5&8191),m+=i[et])}else _(r,m,N[rt]),m+=P[rt]}return _(r,m,N[256]),m+P[256]},C=new r([65540,131080,131088,131104,262176,1048704,1048832,2114560,2117632]),F=new t(0),I=function(){for(var t=new Int32Array(256),n=0;n<256;++n){for(var r=n,e=9;--e;)r=(1&r&&-306674912)^r>>>1;t[n]=r}return t}(),S=function(){var t=1,n=0;return{p:function(r){for(var e=t,i=n,s=0|r.length,a=0;a!=s;){for(var o=Math.min(a+2655,s);a<o;++a)i+=e+=r[a];e=(65535&e)+15*(e>>16),i=(65535&i)+15*(i>>16)}t=e,n=i},d:function(){return(255&(t%=65521))<<24|(65280&t)<<8|(255&(n%=65521))<<8|n>>8}}},L=function(s,a,o,h,u){if(!u&&(u={l:1},a.dictionary)){var c=a.dictionary.subarray(-32768),v=new t(c.length+s.length);v.set(c),v.set(s,c.length),s=v,u.w=c.length}return function(s,a,o,h,u,c){var v=c.z||s.length,d=new t(h+v+5*(1+Math.ceil(v/7e3))+u),p=d.subarray(h,d.length-u),g=c.l,w=7&(c.r||0);if(a){w&&(p[0]=c.r>>3);for(var y=C[a-1],M=y>>13,E=8191&y,z=(1<<o)-1,_=c.p||new n(32768),x=c.h||new n(z+1),A=Math.ceil(o/3),D=2*A,T=function(t){return(s[t]^s[t+1]<<A^s[t+2]<<D)&z},F=new r(25e3),I=new n(288),S=new n(32),L=0,O=0,j=c.i||0,q=0,B=c.w||0,G=0;j+2<v;++j){var H=T(j),J=32767&j,K=x[H];if(_[J]=K,x[H]=J,B<=j){var N=v-j;if((L>7e3||q>24576)&&(N>423||!g)){w=U(s,p,0,F,I,S,O,q,G,j-G,w),q=L=O=0,G=j;for(var P=0;P<286;++P)I[P]=0;for(P=0;P<30;++P)S[P]=0}var Q=2,R=0,V=E,W=J-K&32767;if(N>2&&H==T(j-W))for(var X=Math.min(M,N)-1,Y=Math.min(32767,j),Z=Math.min(258,N);W<=Y&&--V&&J!=K;){if(s[j+Q]==s[j+Q-W]){for(var $=0;$<Z&&s[j+$]==s[j+$-W];++$);if($>Q){if(Q=$,R=W,$>X)break;var tt=Math.min(W,$-2),nt=0;for(P=0;P<tt;++P){var rt=j-W+P&32767,et=rt-_[rt]&32767;et>nt&&(nt=et,K=rt)}}}W+=(J=K)-(K=_[J])&32767}if(R){F[q++]=268435456|f[Q]<<18|l[R];var it=31&f[Q],st=31&l[R];O+=e[it]+i[st],++I[257+it],++S[st],B=j+Q,++L}else F[q++]=s[j],++I[s[j]]}}for(j=Math.max(j,B);j<v;++j)F[q++]=s[j],++I[s[j]];w=U(s,p,g,F,I,S,O,q,G,j-G,w),g||(c.r=7&w|p[w/8|0]<<3,w-=7,c.h=x,c.p=_,c.i=j,c.w=B)}else{for(j=c.w||0;j<v+g;j+=65535){var at=j+65535;at>=v&&(p[w/8|0]=g,at=v),w=k(p,w+1,s.subarray(j,at))}c.i=v}return b(d,0,h+m(w)+u)}(s,null==a.level?6:a.level,null==a.mem?u.l?Math.ceil(1.5*Math.max(8,Math.min(13,Math.log(s.length)))):20:12+a.mem,o,h,u)},O=function(t,n,r){for(;r;++n)t[n]=r,r>>>=8},j=function(){function n(n,r){if("function"==typeof n&&(r=n,n={}),this.ondata=r,this.o=n||{},this.s={l:0,i:32768,w:32768,z:32768},this.b=new t(98304),this.o.dictionary){var e=this.o.dictionary.subarray(-32768);this.b.set(e,32768-e.length),this.s.i=32768-e.length}}return n.prototype.p=function(t,n){this.ondata(L(t,this.o,0,0,this.s),n)},n.prototype.push=function(n,r){this.ondata||E(5),this.s.l&&E(4);var e=n.length+this.s.z;if(e>this.b.length){if(e>2*this.b.length-32768){var i=new t(-32768&e);i.set(this.b.subarray(0,this.s.z)),this.b=i}var s=this.b.length-this.s.z;this.b.set(n.subarray(0,s),this.s.z),this.s.z=this.b.length,this.p(this.b,!1),this.b.set(this.b.subarray(-32768)),this.b.set(n.subarray(s),32768),this.s.z=n.length-s+32768,this.s.i=32766,this.s.w=32768}else this.b.set(n,this.s.z),this.s.z+=n.length;this.s.l=1&r,(this.s.z>this.s.w+8191||r)&&(this.p(this.b,r||!1),this.s.w=this.s.i,this.s.i-=2)},n.prototype.flush=function(){this.ondata||E(5),this.s.l&&E(4),this.p(this.b,!1),this.s.w=this.s.i,this.s.i-=2},n}();function q(t,n){n||(n={});var r=function(){var t=-1;return{p:function(n){for(var r=t,e=0;e<n.length;++e)r=I[255&r^n[e]]^r>>>8;t=r},d:function(){return~t}}}(),e=t.length;r.p(t);var i,s=L(t,n,10+((i=n).filename?i.filename.length+1:0),8),a=s.length;return function(t,n){var r=n.filename;if(t[0]=31,t[1]=139,t[2]=8,t[8]=n.level<2?4:9==n.level?2:0,t[9]=3,0!=n.mtime&&O(t,4,Math.floor(new Date(n.mtime||Date.now())/1e3)),r){t[3]=8;for(var e=0;e<=r.length;++e)t[e+10]=r.charCodeAt(e)}}(s,n),O(s,a-8,r.d()),O(s,a-4,e),s}var B=function(){function t(t,n){this.c=S(),this.v=1,j.call(this,t,n)}return t.prototype.push=function(t,n){this.c.p(t),j.prototype.push.call(this,t,n)},t.prototype.p=function(t,n){var r=L(t,this.o,this.v&&(this.o.dictionary?6:2),n&&4,this.s);this.v&&(function(t,n){var r=n.level,e=0==r?0:r<6?1:9==r?3:2;if(t[0]=120,t[1]=e<<6|(n.dictionary&&32),t[1]|=31-(t[0]<<8|t[1])%31,n.dictionary){var i=S();i.p(n.dictionary),O(t,2,i.d())}}(r,this.o),this.v=0),n&&O(r,r.length-4,this.c.d()),this.ondata(r,n)},t.prototype.flush=function(){j.prototype.flush.call(this)},t}(),G="undefined"!=typeof TextEncoder&&new TextEncoder,H="undefined"!=typeof TextDecoder&&new TextDecoder;try{H.decode(F,{stream:!0})}catch(t){}var J=function(){function t(t){this.ondata=t}return t.prototype.push=function(t,n){this.ondata||E(5),this.d&&E(4),this.ondata(K(t),this.d=n||!1)},t}();function K(n,r){if(G)return G.encode(n);for(var e=n.length,i=new t(n.length+(n.length>>1)),s=0,a=function(t){i[s++]=t},o=0;o<e;++o){if(s+5>i.length){var h=new t(s+8+(e-o<<1));h.set(i),i=h}var f=n.charCodeAt(o);f<128||r?a(f):f<2048?(a(192|f>>6),a(128|63&f)):f>55295&&f<57344?(a(240|(f=65536+(1047552&f)|1023&n.charCodeAt(++o))>>18),a(128|f>>12&63),a(128|f>>6&63),a(128|63&f)):(a(224|f>>12),a(128|f>>6&63),a(128|63&f))}return b(i,0,s)}const N=new class{constructor(){this._init()}clear(){this._init()}addEvent(t){if(!t)throw new Error("Adding invalid event");const n=this._hasEvents?",":"";this.stream.push(n+t),this._hasEvents=!0}finish(){this.stream.push("]",!0);const t=function(t){let n=0;for(const r of t)n+=r.length;const r=new Uint8Array(n);for(let n=0,e=0,i=t.length;n<i;n++){const i=t[n];r.set(i,e),e+=i.length}return r}(this._deflatedData);return this._init(),t}_init(){this._hasEvents=!1,this._deflatedData=[],this.deflate=new B,this.deflate.ondata=(t,n)=>{this._deflatedData.push(t)},this.stream=new J((t,n)=>{this.deflate.push(t,n)}),this.stream.push("[")}},P={clear:()=>{N.clear()},addEvent:t=>N.addEvent(t),finish:()=>N.finish(),compress:t=>function(t){return q(K(t))}(t)};addEventListener("message",function(t){const n=t.data.method,r=t.data.id,e=t.data.arg;if(n in P&&"function"==typeof P[n])try{const t=P[n](e);postMessage({id:r,method:n,success:!0,response:t})}catch(t){postMessage({id:r,method:n,success:!1,response:t.message}),console.error(t)}}),postMessage({id:void 0,method:"init",success:!0,response:void 0});`;
function e() {
  const e2 = new Blob([r$1]);
  return URL.createObjectURL(e2);
}
const CONSOLE_LEVELS = ["log", "warn", "error"];
const PREFIX = "[Replay] ";
function _addBreadcrumb(message, level = "info") {
  addBreadcrumb(
    {
      category: "console",
      data: {
        logger: "replay"
      },
      level,
      message: `${PREFIX}${message}`
    },
    { level }
  );
}
function makeReplayDebugLogger() {
  let _capture = false;
  let _trace = false;
  const _debug = {
    exception: () => void 0,
    infoTick: () => void 0,
    setConfig: (opts) => {
      _capture = !!opts.captureExceptions;
      _trace = !!opts.traceInternals;
    }
  };
  if (DEBUG_BUILD$1) {
    CONSOLE_LEVELS.forEach((name) => {
      _debug[name] = (...args) => {
        debug$2[name](PREFIX, ...args);
        if (_trace) {
          _addBreadcrumb(args.join(""), severityLevelFromString(name));
        }
      };
    });
    _debug.exception = (error2, ...message) => {
      if (message.length && _debug.error) {
        _debug.error(...message);
      }
      debug$2.error(PREFIX, error2);
      if (_capture) {
        captureException(error2, {
          mechanism: {
            handled: true,
            type: "auto.function.replay.debug"
          }
        });
      } else if (_trace) {
        _addBreadcrumb(error2, "error");
      }
    };
    _debug.infoTick = (...args) => {
      debug$2.log(PREFIX, ...args);
      if (_trace) {
        setTimeout(() => _addBreadcrumb(args[0]), 0);
      }
    };
  } else {
    CONSOLE_LEVELS.forEach((name) => {
      _debug[name] = () => void 0;
    });
  }
  return _debug;
}
const debug = makeReplayDebugLogger();
class EventBufferSizeExceededError extends Error {
  constructor() {
    super(`Event buffer exceeded maximum size of ${REPLAY_MAX_EVENT_BUFFER_SIZE}.`);
  }
}
class EventBufferArray {
  constructor() {
    this.events = [];
    this._totalSize = 0;
    this.hasCheckout = false;
    this.waitForCheckout = false;
  }
  /** @inheritdoc */
  get hasEvents() {
    return this.events.length > 0;
  }
  /** @inheritdoc */
  get type() {
    return "sync";
  }
  /** @inheritdoc */
  destroy() {
    this.events = [];
  }
  /** @inheritdoc */
  async addEvent(event) {
    const eventSize = JSON.stringify(event).length;
    this._totalSize += eventSize;
    if (this._totalSize > REPLAY_MAX_EVENT_BUFFER_SIZE) {
      throw new EventBufferSizeExceededError();
    }
    this.events.push(event);
  }
  /** @inheritdoc */
  finish() {
    return new Promise((resolve) => {
      const eventsRet = this.events;
      this.clear();
      resolve(JSON.stringify(eventsRet));
    });
  }
  /** @inheritdoc */
  clear() {
    this.events = [];
    this._totalSize = 0;
    this.hasCheckout = false;
  }
  /** @inheritdoc */
  getEarliestTimestamp() {
    let ts = null;
    for (const { timestamp } of this.events) {
      if (ts === null || timestamp < ts) ts = timestamp;
    }
    return ts === null ? ts : timestampToMs(ts);
  }
}
class WorkerHandler {
  constructor(worker) {
    this._onMessage = ({ data }) => {
      const response = data;
      if (typeof response.id !== "number") {
        return;
      }
      const pending = this._pending.get(response.id);
      if (!pending || pending.method !== response.method) {
        return;
      }
      this._pending.delete(response.id);
      if (!response.success) {
        DEBUG_BUILD$1 && debug.error("Error in compression worker: ", response.response);
        pending.reject(new Error("Error in compression worker"));
        return;
      }
      pending.resolve(response.response);
    };
    this._worker = worker;
    this._id = 0;
    this._pending = /* @__PURE__ */ new Map();
    this._worker.addEventListener("message", this._onMessage);
  }
  /**
   * Ensure the worker is ready (or not).
   * This will either resolve when the worker is ready, or reject if an error occurred.
   */
  ensureReady() {
    if (this._ensureReadyPromise) {
      return this._ensureReadyPromise;
    }
    this._ensureReadyPromise = new Promise((resolve, reject) => {
      this._worker.addEventListener(
        "message",
        ({ data }) => {
          if (data.success) {
            resolve();
          } else {
            DEBUG_BUILD$1 && debug.warn("Received worker message with unsuccessful status", data);
            reject(new Error("Received worker message with unsuccessful status"));
          }
        },
        { once: true }
      );
      this._worker.addEventListener(
        "error",
        (error2) => {
          DEBUG_BUILD$1 && debug.warn("Failed to load Replay compression worker", error2);
          reject(
            new Error(
              `Failed to load Replay compression worker: ${error2 instanceof ErrorEvent && error2.message ? error2.message : "Unknown error. This can happen due to CSP policy restrictions, network issues, or the worker script failing to load."}`
            )
          );
        },
        { once: true }
      );
    });
    return this._ensureReadyPromise;
  }
  /**
   * Destroy the worker.
   */
  destroy() {
    DEBUG_BUILD$1 && debug.log("Destroying compression worker");
    this._worker.removeEventListener("message", this._onMessage);
    this._pending.forEach((pending) => pending.reject(new Error("Worker destroyed")));
    this._pending.clear();
    this._worker.terminate();
  }
  /**
   * Post message to worker and wait for response before resolving promise.
   */
  postMessage(method, arg) {
    const id = this._getAndIncrementId();
    return new Promise((resolve, reject) => {
      this._pending.set(id, {
        method,
        resolve,
        reject
      });
      try {
        this._worker.postMessage({ id, method, arg });
      } catch (error2) {
        this._pending.delete(id);
        reject(error2);
      }
    });
  }
  /** Get the current ID and increment it for the next call. */
  _getAndIncrementId() {
    return this._id++;
  }
}
class EventBufferCompressionWorker {
  constructor(worker) {
    this._worker = new WorkerHandler(worker);
    this._earliestTimestamp = null;
    this._totalSize = 0;
    this.hasCheckout = false;
    this.waitForCheckout = false;
  }
  /** @inheritdoc */
  get hasEvents() {
    return !!this._earliestTimestamp;
  }
  /** @inheritdoc */
  get type() {
    return "worker";
  }
  /**
   * Ensure the worker is ready (or not).
   * This will either resolve when the worker is ready, or reject if an error occurred.
   */
  ensureReady() {
    return this._worker.ensureReady();
  }
  /**
   * Destroy the event buffer.
   */
  destroy() {
    this._worker.destroy();
  }
  /**
   * Add an event to the event buffer.
   *
   * Returns true if event was successfully received and processed by worker.
   */
  addEvent(event) {
    const timestamp = timestampToMs(event.timestamp);
    if (!this._earliestTimestamp || timestamp < this._earliestTimestamp) {
      this._earliestTimestamp = timestamp;
    }
    const data = JSON.stringify(event);
    this._totalSize += data.length;
    if (this._totalSize > REPLAY_MAX_EVENT_BUFFER_SIZE) {
      return Promise.reject(new EventBufferSizeExceededError());
    }
    return this._sendEventToWorker(data);
  }
  /**
   * Finish the event buffer and return the compressed data.
   */
  finish() {
    return this._finishRequest();
  }
  /** @inheritdoc */
  clear() {
    this._earliestTimestamp = null;
    this._totalSize = 0;
    this.hasCheckout = false;
    this._worker.postMessage("clear").then(null, (e2) => {
      DEBUG_BUILD$1 && debug.exception(e2, 'Sending "clear" message to worker failed', e2);
    });
  }
  /** @inheritdoc */
  getEarliestTimestamp() {
    return this._earliestTimestamp;
  }
  /**
   * Send the event to the worker.
   */
  _sendEventToWorker(data) {
    return this._worker.postMessage("addEvent", data);
  }
  /**
   * Finish the request and return the compressed data from the worker.
   */
  async _finishRequest() {
    const response = await this._worker.postMessage("finish");
    this._earliestTimestamp = null;
    this._totalSize = 0;
    return response;
  }
}
class EventBufferProxy {
  constructor(worker) {
    this._fallback = new EventBufferArray();
    this._compression = new EventBufferCompressionWorker(worker);
    this._used = this._fallback;
    this._ensureWorkerIsLoadedPromise = this._ensureWorkerIsLoaded();
  }
  /** @inheritdoc */
  get waitForCheckout() {
    return this._used.waitForCheckout;
  }
  /** @inheritdoc */
  get type() {
    return this._used.type;
  }
  /** @inheritDoc */
  get hasEvents() {
    return this._used.hasEvents;
  }
  /** @inheritdoc */
  get hasCheckout() {
    return this._used.hasCheckout;
  }
  /** @inheritdoc */
  set hasCheckout(value) {
    this._used.hasCheckout = value;
  }
  /** @inheritdoc */
  // eslint-disable-next-line @typescript-eslint/adjacent-overload-signatures
  set waitForCheckout(value) {
    this._used.waitForCheckout = value;
  }
  /** @inheritDoc */
  destroy() {
    this._fallback.destroy();
    this._compression.destroy();
  }
  /** @inheritdoc */
  clear() {
    return this._used.clear();
  }
  /** @inheritdoc */
  getEarliestTimestamp() {
    return this._used.getEarliestTimestamp();
  }
  /**
   * Add an event to the event buffer.
   *
   * Returns true if event was successfully added.
   */
  addEvent(event) {
    return this._used.addEvent(event);
  }
  /** @inheritDoc */
  async finish() {
    await this.ensureWorkerIsLoaded();
    return this._used.finish();
  }
  /** Ensure the worker has loaded. */
  ensureWorkerIsLoaded() {
    return this._ensureWorkerIsLoadedPromise;
  }
  /** Actually check if the worker has been loaded. */
  async _ensureWorkerIsLoaded() {
    try {
      await this._compression.ensureReady();
    } catch (error2) {
      DEBUG_BUILD$1 && debug.exception(error2, "Failed to load the compression worker, falling back to simple buffer");
      return;
    }
    await this._switchToCompressionWorker();
  }
  /** Switch the used buffer to the compression worker. */
  async _switchToCompressionWorker() {
    const { events, hasCheckout, waitForCheckout } = this._fallback;
    const addEventPromises = [];
    for (const event of events) {
      addEventPromises.push(this._compression.addEvent(event));
    }
    this._compression.hasCheckout = hasCheckout;
    this._compression.waitForCheckout = waitForCheckout;
    this._used = this._compression;
    try {
      await Promise.all(addEventPromises);
      this._fallback.clear();
    } catch (error2) {
      DEBUG_BUILD$1 && debug.exception(error2, "Failed to add events when switching buffers.");
    }
  }
}
function createEventBuffer({
  useCompression,
  workerUrl: customWorkerUrl
}) {
  if (useCompression && // eslint-disable-next-line no-restricted-globals
  window.Worker) {
    const worker = _loadWorker(customWorkerUrl);
    if (worker) {
      return worker;
    }
  }
  DEBUG_BUILD$1 && debug.log("Using simple buffer");
  return new EventBufferArray();
}
function _loadWorker(customWorkerUrl) {
  try {
    const workerUrl = customWorkerUrl || _getWorkerUrl();
    if (!workerUrl) {
      return;
    }
    DEBUG_BUILD$1 && debug.log(`Using compression worker${customWorkerUrl ? ` from ${customWorkerUrl}` : ""}`);
    const worker = new Worker(workerUrl);
    return new EventBufferProxy(worker);
  } catch (error2) {
    DEBUG_BUILD$1 && debug.exception(error2, "Failed to create compression worker");
  }
}
function _getWorkerUrl() {
  if (typeof __SENTRY_EXCLUDE_REPLAY_WORKER__ === "undefined" || !__SENTRY_EXCLUDE_REPLAY_WORKER__) {
    return e();
  }
  return "";
}
function hasSessionStorage() {
  try {
    return "sessionStorage" in WINDOW && !!WINDOW.sessionStorage;
  } catch {
    return false;
  }
}
function clearSession(replay) {
  deleteSession();
  replay.session = void 0;
}
function deleteSession() {
  if (!hasSessionStorage()) {
    return;
  }
  try {
    WINDOW.sessionStorage.removeItem(REPLAY_SESSION_KEY);
  } catch {
  }
}
function isSampled(sampleRate) {
  if (sampleRate === void 0) {
    return false;
  }
  return Math.random() < sampleRate;
}
function saveSession(session) {
  if (!hasSessionStorage()) {
    return;
  }
  try {
    WINDOW.sessionStorage.setItem(REPLAY_SESSION_KEY, JSON.stringify(session));
  } catch {
  }
}
function makeSession(session) {
  const now = Date.now();
  const id = session.id || uuid4();
  const started = session.started || now;
  const lastActivity = session.lastActivity || now;
  const segmentId = session.segmentId || 0;
  const sampled = session.sampled;
  const previousSessionId = session.previousSessionId;
  const dirty = session.dirty || false;
  return {
    id,
    started,
    lastActivity,
    segmentId,
    sampled,
    previousSessionId,
    dirty
  };
}
function getSessionSampleType(sessionSampleRate, allowBuffering) {
  return isSampled(sessionSampleRate) ? "session" : allowBuffering ? "buffer" : false;
}
function createSession({ sessionSampleRate, allowBuffering, stickySession = false }, { previousSessionId } = {}) {
  const sampled = getSessionSampleType(sessionSampleRate, allowBuffering);
  const session = makeSession({
    sampled,
    previousSessionId
  });
  if (stickySession) {
    saveSession(session);
  }
  return session;
}
function fetchSession() {
  if (!hasSessionStorage()) {
    return null;
  }
  try {
    const sessionStringFromStorage = WINDOW.sessionStorage.getItem(REPLAY_SESSION_KEY);
    if (!sessionStringFromStorage) {
      return null;
    }
    const sessionObj = JSON.parse(sessionStringFromStorage);
    DEBUG_BUILD$1 && debug.infoTick("Loading existing session");
    return makeSession(sessionObj);
  } catch {
    return null;
  }
}
function isExpired(initialTime, expiry, targetTime = +/* @__PURE__ */ new Date()) {
  if (initialTime === null || expiry === void 0 || expiry < 0) {
    return true;
  }
  if (expiry === 0) {
    return false;
  }
  return initialTime + expiry <= targetTime;
}
function isSessionExpired(session, {
  maxReplayDuration,
  sessionIdleExpire,
  targetTime = Date.now()
}) {
  return (
    // First, check that maximum session length has not been exceeded
    isExpired(session.started, maxReplayDuration, targetTime) || // check that the idle timeout has not been exceeded (i.e. user has
    // performed an action within the last `sessionIdleExpire` ms)
    isExpired(session.lastActivity, sessionIdleExpire, targetTime)
  );
}
function shouldRefreshSession(session, { sessionIdleExpire, maxReplayDuration }) {
  if (!isSessionExpired(session, { sessionIdleExpire, maxReplayDuration })) {
    return false;
  }
  if (session.sampled === "buffer" && session.segmentId === 0) {
    return false;
  }
  return true;
}
function loadOrCreateSession({
  sessionIdleExpire,
  maxReplayDuration,
  previousSessionId
}, sessionOptions) {
  const existingSession = sessionOptions.stickySession && fetchSession();
  if (!existingSession) {
    DEBUG_BUILD$1 && debug.infoTick("Creating new session");
    return createSession(sessionOptions, { previousSessionId });
  }
  if (!shouldRefreshSession(existingSession, { sessionIdleExpire, maxReplayDuration })) {
    return existingSession;
  }
  DEBUG_BUILD$1 && debug.infoTick("Session in sessionStorage is expired, creating new one...");
  return createSession(sessionOptions, { previousSessionId: existingSession.id });
}
function isCustomEvent(event) {
  return event.type === EventType.Custom;
}
function addEventSync(replay, event, isCheckout) {
  if (!shouldAddEvent(replay, event)) {
    return false;
  }
  _addEvent(replay, event, isCheckout);
  return true;
}
function addEvent(replay, event, isCheckout) {
  if (!shouldAddEvent(replay, event)) {
    return Promise.resolve(null);
  }
  return _addEvent(replay, event, isCheckout);
}
async function _addEvent(replay, event, isCheckout) {
  const { eventBuffer } = replay;
  if (!eventBuffer || eventBuffer.waitForCheckout && !isCheckout) {
    return null;
  }
  const isBufferMode = replay.recordingMode === "buffer";
  try {
    if (isCheckout && isBufferMode) {
      eventBuffer.clear();
    }
    if (isCheckout) {
      eventBuffer.hasCheckout = true;
      eventBuffer.waitForCheckout = false;
    }
    const replayOptions = replay.getOptions();
    const eventAfterPossibleCallback = maybeApplyCallback(event, replayOptions.beforeAddRecordingEvent);
    if (!eventAfterPossibleCallback) {
      return;
    }
    return await eventBuffer.addEvent(eventAfterPossibleCallback);
  } catch (error2) {
    const isExceeded = error2 && error2 instanceof EventBufferSizeExceededError;
    const reason = isExceeded ? "eventBufferOverflow" : "eventBufferError";
    const client = getClient();
    if (client) {
      const dropReason = isExceeded ? "buffer_overflow" : "internal_sdk_error";
      client.recordDroppedEvent(dropReason, "replay");
    }
    if (isExceeded && isBufferMode) {
      eventBuffer.clear();
      eventBuffer.waitForCheckout = true;
      return null;
    }
    replay.handleException(error2);
    await replay.stop({ reason });
  }
}
function shouldAddEvent(replay, event) {
  if (!replay.eventBuffer || replay.isPaused() || !replay.isEnabled()) {
    return false;
  }
  const timestampInMs = timestampToMs(event.timestamp);
  if (timestampInMs + replay.timeouts.sessionIdlePause < Date.now()) {
    return false;
  }
  if (timestampInMs > replay.getContext().initialTimestamp + replay.getOptions().maxReplayDuration) {
    DEBUG_BUILD$1 && debug.infoTick(`Skipping event with timestamp ${timestampInMs} because it is after maxReplayDuration`);
    return false;
  }
  return true;
}
function maybeApplyCallback(event, callback) {
  try {
    if (typeof callback === "function" && isCustomEvent(event)) {
      return callback(event);
    }
  } catch (error2) {
    DEBUG_BUILD$1 && debug.exception(error2, "An error occurred in the `beforeAddRecordingEvent` callback, skipping the event...");
    return null;
  }
  return event;
}
function isErrorEvent(event) {
  return !event.type;
}
function isTransactionEvent(event) {
  return event.type === "transaction";
}
function isReplayEvent(event) {
  return event.type === "replay_event";
}
function isFeedbackEvent(event) {
  return event.type === "feedback";
}
function handleAfterSendEvent(replay) {
  return (event, sendResponse) => {
    if (!replay.isEnabled() || !isErrorEvent(event) && !isTransactionEvent(event)) {
      return;
    }
    const statusCode = sendResponse.statusCode;
    if (!statusCode || statusCode < 200 || statusCode >= 300) {
      return;
    }
    if (isTransactionEvent(event)) {
      handleTransactionEvent(replay, event);
      return;
    }
    handleErrorEvent(replay, event);
  };
}
function handleTransactionEvent(replay, event) {
  const replayContext = replay.getContext();
  if (event.contexts?.trace?.trace_id && replayContext.traceIds.size < 100) {
    replayContext.traceIds.add(event.contexts.trace.trace_id);
  }
}
function handleErrorEvent(replay, event) {
  const replayContext = replay.getContext();
  if (event.event_id && replayContext.errorIds.size < 100) {
    replayContext.errorIds.add(event.event_id);
  }
  if (replay.recordingMode !== "buffer" || !event.tags?.replayId) {
    return;
  }
  const { beforeErrorSampling } = replay.getOptions();
  if (typeof beforeErrorSampling === "function" && !beforeErrorSampling(event)) {
    return;
  }
  setTimeout$3(async () => {
    try {
      await replay.sendBufferedReplayOrFlush();
    } catch (err) {
      replay.handleException(err);
    }
  });
}
function handleBeforeSendEvent(replay) {
  return (event) => {
    if (!replay.isEnabled() || !isErrorEvent(event)) {
      return;
    }
    handleHydrationError(replay, event);
  };
}
function handleHydrationError(replay, event) {
  const exceptionValue = event.exception?.values?.[0]?.value;
  if (typeof exceptionValue !== "string") {
    return;
  }
  if (
    // Only matches errors in production builds of react-dom
    // Example https://reactjs.org/docs/error-decoder.html?invariant=423
    // With newer React versions, the messages changed to a different website https://react.dev/errors/418
    exceptionValue.match(
      /(reactjs\.org\/docs\/error-decoder\.html\?invariant=|react\.dev\/errors\/)(418|419|422|423|425)/
    ) || // Development builds of react-dom
    // Error 1: Hydration failed because the initial UI does not match what was rendered on the server.
    // Error 2: Text content does not match server-rendered HTML. Warning: Text content did not match.
    exceptionValue.match(/(does not match server-rendered HTML|Hydration failed because)/i)
  ) {
    const breadcrumb = createBreadcrumb({
      category: "replay.hydrate-error",
      data: {
        url: getLocationHref()
      }
    });
    addBreadcrumbEvent(replay, breadcrumb);
  }
}
function handleBreadcrumbs(replay) {
  const client = getClient();
  if (!client) {
    return;
  }
  client.on("beforeAddBreadcrumb", (breadcrumb) => beforeAddBreadcrumb(replay, breadcrumb));
}
function beforeAddBreadcrumb(replay, breadcrumb) {
  if (!replay.isEnabled() || !isBreadcrumbWithCategory(breadcrumb)) {
    return;
  }
  const result = normalizeBreadcrumb(breadcrumb);
  if (result) {
    addBreadcrumbEvent(replay, result);
  }
}
function normalizeBreadcrumb(breadcrumb) {
  if (!isBreadcrumbWithCategory(breadcrumb) || [
    // fetch & xhr are handled separately,in handleNetworkBreadcrumbs
    "fetch",
    "xhr",
    // These two are breadcrumbs for emitted sentry events, we don't care about them
    "sentry.event",
    "sentry.transaction"
  ].includes(breadcrumb.category) || // We capture UI breadcrumbs separately
  breadcrumb.category.startsWith("ui.")) {
    return null;
  }
  if (breadcrumb.category === "console") {
    return normalizeConsoleBreadcrumb(breadcrumb);
  }
  return createBreadcrumb(breadcrumb);
}
function normalizeConsoleBreadcrumb(breadcrumb) {
  const args = breadcrumb.data?.arguments;
  if (!Array.isArray(args) || args.length === 0) {
    return createBreadcrumb(breadcrumb);
  }
  let isTruncated = false;
  const normalizedArgs = args.map((arg) => {
    if (!arg) {
      return arg;
    }
    if (typeof arg === "string") {
      if (arg.length > CONSOLE_ARG_MAX_SIZE) {
        isTruncated = true;
        return `${arg.slice(0, CONSOLE_ARG_MAX_SIZE)}…`;
      }
      return arg;
    }
    if (typeof arg === "object") {
      try {
        const normalizedArg = normalize(arg, 7);
        const stringified = JSON.stringify(normalizedArg);
        if (stringified.length > CONSOLE_ARG_MAX_SIZE) {
          isTruncated = true;
          return `${JSON.stringify(normalizedArg, null, 2).slice(0, CONSOLE_ARG_MAX_SIZE)}…`;
        }
        return normalizedArg;
      } catch {
      }
    }
    return arg;
  });
  return createBreadcrumb({
    ...breadcrumb,
    data: {
      ...breadcrumb.data,
      arguments: normalizedArgs,
      ...isTruncated ? { _meta: { warnings: ["CONSOLE_ARG_TRUNCATED"] } } : {}
    }
  });
}
function isBreadcrumbWithCategory(breadcrumb) {
  return !!breadcrumb.category;
}
function isRrwebError(event, hint) {
  if (event.type || !event.exception?.values?.length) {
    return false;
  }
  if (hint.originalException?.__rrweb__) {
    return true;
  }
  return false;
}
function resetReplayIdOnDynamicSamplingContext() {
  const dsc = getCurrentScope().getPropagationContext().dsc;
  if (dsc) {
    delete dsc.replay_id;
  }
  const activeSpan = getActiveSpan();
  if (activeSpan) {
    const dsc2 = getDynamicSamplingContextFromSpan(activeSpan);
    delete dsc2.replay_id;
  }
}
function setReplayIdOnDynamicSamplingContext(replayId) {
  const dsc = getCurrentScope().getPropagationContext().dsc;
  if (dsc) {
    dsc.replay_id = replayId;
  }
  const activeSpan = getActiveSpan();
  if (activeSpan) {
    const dsc2 = getDynamicSamplingContextFromSpan(activeSpan);
    dsc2.replay_id = replayId;
  }
}
function addFeedbackBreadcrumb(replay, event) {
  replay.triggerUserActivity();
  replay.addUpdate(() => {
    if (!event.timestamp) {
      return true;
    }
    replay.throttledAddEvent({
      type: EventType.Custom,
      timestamp: event.timestamp * 1e3,
      data: {
        tag: "breadcrumb",
        payload: {
          timestamp: event.timestamp,
          type: "default",
          category: "sentry.feedback",
          data: {
            feedbackId: event.event_id
          }
        }
      }
    });
    return false;
  });
}
function shouldSampleForBufferEvent(replay, event) {
  if (replay.recordingMode !== "buffer") {
    return false;
  }
  if (event.message === UNABLE_TO_SEND_REPLAY) {
    return false;
  }
  if (!event.exception || event.type) {
    return false;
  }
  return isSampled(replay.getOptions().errorSampleRate);
}
function handleGlobalEventListener(replay) {
  return Object.assign(
    (event, hint) => {
      if (replay.session && shouldRefreshSession(replay.session, {
        maxReplayDuration: replay.getOptions().maxReplayDuration,
        sessionIdleExpire: replay.timeouts.sessionIdleExpire
      })) {
        resetReplayIdOnDynamicSamplingContext();
      }
      if (!replay.isEnabled() || replay.isPaused()) {
        return event;
      }
      if (isReplayEvent(event)) {
        delete event.breadcrumbs;
        return event;
      }
      if (!isErrorEvent(event) && !isTransactionEvent(event) && !isFeedbackEvent(event)) {
        return event;
      }
      const isSessionActive = replay.checkAndHandleExpiredSession();
      if (!isSessionActive) {
        resetReplayIdOnDynamicSamplingContext();
        return event;
      }
      if (isFeedbackEvent(event)) {
        replay.flush();
        event.contexts.feedback.replay_id = replay.getSessionId();
        addFeedbackBreadcrumb(replay, event);
        return event;
      }
      if (isRrwebError(event, hint) && !replay.getOptions()._experiments.captureExceptions) {
        DEBUG_BUILD$1 && debug.log("Ignoring error from rrweb internals", event);
        return null;
      }
      const isErrorEventSampled = shouldSampleForBufferEvent(replay, event);
      const shouldTagReplayId = isErrorEventSampled || replay.recordingMode === "session";
      if (shouldTagReplayId) {
        event.tags = { ...event.tags, replayId: replay.getSessionId() };
      }
      if (isErrorEventSampled && replay.recordingMode === "buffer" && replay.session?.sampled === "buffer") {
        const session = replay.session;
        session.dirty = true;
        if (replay.getOptions().stickySession) {
          saveSession(session);
        }
      }
      return event;
    },
    { id: "Replay" }
  );
}
function createPerformanceSpans(replay, entries) {
  return entries.map(({ type, start, end, name, data }) => {
    const response = replay.throttledAddEvent({
      type: EventType.Custom,
      timestamp: start,
      data: {
        tag: "performanceSpan",
        payload: {
          op: type,
          description: name,
          startTimestamp: start,
          endTimestamp: end,
          data
        }
      }
    });
    return typeof response === "string" ? Promise.resolve(null) : response;
  });
}
function handleHistory(handlerData) {
  const { from, to } = handlerData;
  const now = Date.now() / 1e3;
  return {
    type: "navigation.push",
    start: now,
    end: now,
    name: to,
    data: {
      previous: from
    }
  };
}
function handleHistorySpanListener(replay) {
  return (handlerData) => {
    if (!replay.isEnabled()) {
      return;
    }
    const result = handleHistory(handlerData);
    if (result === null) {
      return;
    }
    replay.getContext().urls.push(result.name);
    replay.triggerUserActivity();
    replay.addUpdate(() => {
      createPerformanceSpans(replay, [result]);
      return false;
    });
  };
}
function shouldFilterRequest(replay, url) {
  if (DEBUG_BUILD$1 && replay.getOptions()._experiments.traceInternals) {
    return false;
  }
  return isSentryRequestUrl(url, getClient());
}
function addNetworkBreadcrumb(replay, result) {
  if (!replay.isEnabled()) {
    return;
  }
  if (result === null) {
    return;
  }
  if (shouldFilterRequest(replay, result.name)) {
    return;
  }
  replay.addUpdate(() => {
    createPerformanceSpans(replay, [result]);
    return true;
  });
}
function getBodySize(body) {
  if (!body) {
    return void 0;
  }
  const textEncoder = new TextEncoder();
  try {
    if (typeof body === "string") {
      return textEncoder.encode(body).length;
    }
    if (body instanceof URLSearchParams) {
      return textEncoder.encode(body.toString()).length;
    }
    if (body instanceof FormData) {
      const formDataStr = serializeFormData(body);
      return textEncoder.encode(formDataStr).length;
    }
    if (body instanceof Blob) {
      return body.size;
    }
    if (body instanceof ArrayBuffer) {
      return body.byteLength;
    }
  } catch {
  }
  return void 0;
}
function parseContentLengthHeader(header) {
  if (!header) {
    return void 0;
  }
  const size = parseInt(header, 10);
  return isNaN(size) ? void 0 : size;
}
function mergeWarning(info2, warning) {
  if (!info2) {
    return {
      headers: {},
      size: void 0,
      _meta: {
        warnings: [warning]
      }
    };
  }
  const newMeta = { ...info2._meta };
  const existingWarnings = newMeta.warnings || [];
  newMeta.warnings = [...existingWarnings, warning];
  info2._meta = newMeta;
  return info2;
}
function makeNetworkReplayBreadcrumb(type, data) {
  if (!data) {
    return null;
  }
  const { startTimestamp, endTimestamp, url, method, statusCode, request, response } = data;
  const result = {
    type,
    start: startTimestamp / 1e3,
    end: endTimestamp / 1e3,
    name: url,
    data: {
      method,
      statusCode,
      request,
      response
    }
  };
  return result;
}
function buildSkippedNetworkRequestOrResponse(bodySize) {
  return {
    headers: {},
    size: bodySize,
    _meta: {
      warnings: ["URL_SKIPPED"]
    }
  };
}
function buildNetworkRequestOrResponse(headers, bodySize, body) {
  if (!bodySize && Object.keys(headers).length === 0) {
    return void 0;
  }
  if (!bodySize) {
    return {
      headers
    };
  }
  if (!body) {
    return {
      headers,
      size: bodySize
    };
  }
  const info2 = {
    headers,
    size: bodySize
  };
  const { body: normalizedBody, warnings } = normalizeNetworkBody(body);
  info2.body = normalizedBody;
  if (warnings?.length) {
    info2._meta = {
      warnings
    };
  }
  return info2;
}
function getAllowedHeaders(headers, allowedHeaders) {
  return Object.entries(headers).reduce((filteredHeaders, [key, value]) => {
    const normalizedKey = key.toLowerCase();
    if (allowedHeaders.includes(normalizedKey) && headers[key]) {
      filteredHeaders[normalizedKey] = value;
    }
    return filteredHeaders;
  }, {});
}
function normalizeNetworkBody(body) {
  if (!body || typeof body !== "string") {
    return {
      body
    };
  }
  const exceedsSizeLimit = body.length > NETWORK_BODY_MAX_SIZE;
  const isProbablyJson = _strIsProbablyJson(body);
  if (exceedsSizeLimit) {
    const truncatedBody = body.slice(0, NETWORK_BODY_MAX_SIZE);
    if (isProbablyJson) {
      return {
        body: truncatedBody,
        warnings: ["MAYBE_JSON_TRUNCATED"]
      };
    }
    return {
      body: `${truncatedBody}…`,
      warnings: ["TEXT_TRUNCATED"]
    };
  }
  if (isProbablyJson) {
    try {
      const jsonBody = JSON.parse(body);
      return {
        body: jsonBody
      };
    } catch {
    }
  }
  return {
    body
  };
}
function _strIsProbablyJson(str) {
  const first = str[0];
  const last = str[str.length - 1];
  return first === "[" && last === "]" || first === "{" && last === "}";
}
function urlMatches(url, urls) {
  const fullUrl = getFullUrl(url);
  return stringMatchesSomePattern(fullUrl, urls);
}
function getFullUrl(url, baseURI = WINDOW.document.baseURI) {
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith(WINDOW.location.origin)) {
    return url;
  }
  const fixedUrl = new URL(url, baseURI);
  if (fixedUrl.origin !== new URL(baseURI).origin) {
    return url;
  }
  const fullUrl = fixedUrl.href;
  if (!url.endsWith("/") && fullUrl.endsWith("/")) {
    return fullUrl.slice(0, -1);
  }
  return fullUrl;
}
async function captureFetchBreadcrumbToReplay(breadcrumb, hint, options) {
  try {
    const data = await _prepareFetchData(breadcrumb, hint, options);
    const result = makeNetworkReplayBreadcrumb("resource.fetch", data);
    addNetworkBreadcrumb(options.replay, result);
  } catch (error2) {
    DEBUG_BUILD$1 && debug.exception(error2, "Failed to capture fetch breadcrumb");
  }
}
function enrichFetchBreadcrumb(breadcrumb, hint) {
  const { input, response } = hint;
  const body = input ? getFetchRequestArgBody(input) : void 0;
  const reqSize = getBodySize(body);
  const resSize = response ? parseContentLengthHeader(response.headers.get("content-length")) : void 0;
  if (reqSize !== void 0) {
    breadcrumb.data.request_body_size = reqSize;
  }
  if (resSize !== void 0) {
    breadcrumb.data.response_body_size = resSize;
  }
}
async function _prepareFetchData(breadcrumb, hint, options) {
  const now = Date.now();
  const { startTimestamp = now, endTimestamp = now } = hint;
  const {
    url,
    method,
    status_code: statusCode = 0,
    request_body_size: requestBodySize,
    response_body_size: responseBodySize
  } = breadcrumb.data;
  const captureDetails = urlMatches(url, options.networkDetailAllowUrls) && !urlMatches(url, options.networkDetailDenyUrls);
  const request = captureDetails ? _getRequestInfo(options, hint.input, requestBodySize) : buildSkippedNetworkRequestOrResponse(requestBodySize);
  const response = await _getResponseInfo(captureDetails, options, hint.response, responseBodySize);
  return {
    startTimestamp,
    endTimestamp,
    url,
    method,
    statusCode,
    request,
    response
  };
}
function _getRequestInfo({ networkCaptureBodies, networkRequestHeaders }, input, requestBodySize) {
  const headers = input ? getRequestHeaders(input, networkRequestHeaders) : {};
  if (!networkCaptureBodies) {
    return buildNetworkRequestOrResponse(headers, requestBodySize, void 0);
  }
  const requestBody = getFetchRequestArgBody(input);
  const [bodyStr, warning] = getBodyString(requestBody, debug);
  const data = buildNetworkRequestOrResponse(headers, requestBodySize, bodyStr);
  if (warning) {
    return mergeWarning(data, warning);
  }
  return data;
}
async function _getResponseInfo(captureDetails, {
  networkCaptureBodies,
  networkResponseHeaders
}, response, responseBodySize) {
  if (!captureDetails && responseBodySize !== void 0) {
    return buildSkippedNetworkRequestOrResponse(responseBodySize);
  }
  const headers = response ? getAllHeaders(response.headers, networkResponseHeaders) : {};
  if (!response || !networkCaptureBodies && responseBodySize !== void 0) {
    return buildNetworkRequestOrResponse(headers, responseBodySize, void 0);
  }
  const [bodyText, warning] = await _parseFetchResponseBody(response);
  const result = getResponseData(bodyText, {
    networkCaptureBodies,
    responseBodySize,
    captureDetails,
    headers
  });
  if (warning) {
    return mergeWarning(result, warning);
  }
  return result;
}
function getResponseData(bodyText, {
  networkCaptureBodies,
  responseBodySize,
  captureDetails,
  headers
}) {
  try {
    const size = bodyText?.length && responseBodySize === void 0 ? getBodySize(bodyText) : responseBodySize;
    if (!captureDetails) {
      return buildSkippedNetworkRequestOrResponse(size);
    }
    if (networkCaptureBodies) {
      return buildNetworkRequestOrResponse(headers, size, bodyText);
    }
    return buildNetworkRequestOrResponse(headers, size, void 0);
  } catch (error2) {
    DEBUG_BUILD$1 && debug.exception(error2, "Failed to serialize response body");
    return buildNetworkRequestOrResponse(headers, responseBodySize, void 0);
  }
}
async function _parseFetchResponseBody(response) {
  const res = _tryCloneResponse(response);
  if (!res) {
    return [void 0, "BODY_PARSE_ERROR"];
  }
  try {
    const text = await _tryGetResponseText(res);
    return [text];
  } catch (error2) {
    if (error2 instanceof Error && error2.message.indexOf("Timeout") > -1) {
      DEBUG_BUILD$1 && debug.warn("Parsing text body from response timed out");
      return [void 0, "BODY_PARSE_TIMEOUT"];
    }
    DEBUG_BUILD$1 && debug.exception(error2, "Failed to get text body from response");
    return [void 0, "BODY_PARSE_ERROR"];
  }
}
function getAllHeaders(headers, allowedHeaders) {
  const allHeaders = {};
  allowedHeaders.forEach((header) => {
    if (headers.get(header)) {
      allHeaders[header] = headers.get(header);
    }
  });
  return allHeaders;
}
function getRequestHeaders(fetchArgs, allowedHeaders) {
  if (fetchArgs.length === 1 && typeof fetchArgs[0] !== "string") {
    return getHeadersFromOptions(fetchArgs[0], allowedHeaders);
  }
  if (fetchArgs.length === 2) {
    return getHeadersFromOptions(fetchArgs[1], allowedHeaders);
  }
  return {};
}
function getHeadersFromOptions(input, allowedHeaders) {
  if (!input) {
    return {};
  }
  const headers = input.headers;
  if (!headers) {
    return {};
  }
  if (headers instanceof Headers) {
    return getAllHeaders(headers, allowedHeaders);
  }
  if (Array.isArray(headers)) {
    return {};
  }
  return getAllowedHeaders(headers, allowedHeaders);
}
function _tryCloneResponse(response) {
  try {
    return response.clone();
  } catch (error2) {
    DEBUG_BUILD$1 && debug.exception(error2, "Failed to clone response body");
  }
}
function _tryGetResponseText(response) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout$3(() => reject(new Error("Timeout while trying to read response body")), 500);
    _getResponseText(response).then(
      (txt) => resolve(txt),
      (reason) => reject(reason)
    ).finally(() => clearTimeout(timeout));
  });
}
async function _getResponseText(response) {
  return await response.text();
}
async function captureXhrBreadcrumbToReplay(breadcrumb, hint, options) {
  try {
    const data = _prepareXhrData(breadcrumb, hint, options);
    const result = makeNetworkReplayBreadcrumb("resource.xhr", data);
    addNetworkBreadcrumb(options.replay, result);
  } catch (error2) {
    DEBUG_BUILD$1 && debug.exception(error2, "Failed to capture xhr breadcrumb");
  }
}
function enrichXhrBreadcrumb(breadcrumb, hint) {
  const { xhr, input } = hint;
  if (!xhr) {
    return;
  }
  const reqSize = getBodySize(input);
  const resSize = xhr.getResponseHeader("content-length") ? parseContentLengthHeader(xhr.getResponseHeader("content-length")) : _getBodySize(xhr.response, xhr.responseType);
  if (reqSize !== void 0) {
    breadcrumb.data.request_body_size = reqSize;
  }
  if (resSize !== void 0) {
    breadcrumb.data.response_body_size = resSize;
  }
}
function _prepareXhrData(breadcrumb, hint, options) {
  const now = Date.now();
  const { startTimestamp = now, endTimestamp = now, input, xhr } = hint;
  const {
    url,
    method,
    status_code: statusCode = 0,
    request_body_size: requestBodySize,
    response_body_size: responseBodySize
  } = breadcrumb.data;
  if (!url) {
    return null;
  }
  if (!xhr || !urlMatches(url, options.networkDetailAllowUrls) || urlMatches(url, options.networkDetailDenyUrls)) {
    const request2 = buildSkippedNetworkRequestOrResponse(requestBodySize);
    const response2 = buildSkippedNetworkRequestOrResponse(responseBodySize);
    return {
      startTimestamp,
      endTimestamp,
      url,
      method,
      statusCode,
      request: request2,
      response: response2
    };
  }
  const xhrInfo = xhr[SENTRY_XHR_DATA_KEY];
  const networkRequestHeaders = xhrInfo ? getAllowedHeaders(xhrInfo.request_headers, options.networkRequestHeaders) : {};
  const networkResponseHeaders = getAllowedHeaders(parseXhrResponseHeaders(xhr), options.networkResponseHeaders);
  const [requestBody, requestWarning] = options.networkCaptureBodies ? getBodyString(input, debug) : [void 0];
  const [responseBody, responseWarning] = options.networkCaptureBodies ? _getXhrResponseBody(xhr) : [void 0];
  const request = buildNetworkRequestOrResponse(networkRequestHeaders, requestBodySize, requestBody);
  const response = buildNetworkRequestOrResponse(networkResponseHeaders, responseBodySize, responseBody);
  return {
    startTimestamp,
    endTimestamp,
    url,
    method,
    statusCode,
    request: requestWarning ? mergeWarning(request, requestWarning) : request,
    response: responseWarning ? mergeWarning(response, responseWarning) : response
  };
}
function _getXhrResponseBody(xhr) {
  const errors = [];
  try {
    return [xhr.responseText];
  } catch (e2) {
    errors.push(e2);
  }
  try {
    return _parseXhrResponse(xhr.response, xhr.responseType);
  } catch (e2) {
    errors.push(e2);
  }
  DEBUG_BUILD$1 && debug.warn("Failed to get xhr response body", ...errors);
  return [void 0];
}
function _parseXhrResponse(body, responseType) {
  try {
    if (typeof body === "string") {
      return [body];
    }
    if (body instanceof Document) {
      return [body.body.outerHTML];
    }
    if (responseType === "json" && body && typeof body === "object") {
      return [JSON.stringify(body)];
    }
    if (!body) {
      return [void 0];
    }
  } catch (error2) {
    DEBUG_BUILD$1 && debug.exception(error2, "Failed to serialize body", body);
    return [void 0, "BODY_PARSE_ERROR"];
  }
  DEBUG_BUILD$1 && debug.log("Skipping network body because of body type", body);
  return [void 0, "UNPARSEABLE_BODY_TYPE"];
}
function _getBodySize(body, responseType) {
  try {
    const bodyStr = responseType === "json" && body && typeof body === "object" ? JSON.stringify(body) : body;
    return getBodySize(bodyStr);
  } catch {
    return void 0;
  }
}
function handleNetworkBreadcrumbs(replay) {
  const client = getClient();
  try {
    const {
      networkDetailAllowUrls,
      networkDetailDenyUrls,
      networkCaptureBodies,
      networkRequestHeaders,
      networkResponseHeaders
    } = replay.getOptions();
    const options = {
      replay,
      networkDetailAllowUrls,
      networkDetailDenyUrls,
      networkCaptureBodies,
      networkRequestHeaders,
      networkResponseHeaders
    };
    if (client) {
      client.on("beforeAddBreadcrumb", (breadcrumb, hint) => beforeAddNetworkBreadcrumb(options, breadcrumb, hint));
    }
  } catch {
  }
}
function beforeAddNetworkBreadcrumb(options, breadcrumb, hint) {
  if (!breadcrumb.data) {
    return;
  }
  try {
    if (_isXhrBreadcrumb(breadcrumb) && _isXhrHint(hint)) {
      enrichXhrBreadcrumb(breadcrumb, hint);
      captureXhrBreadcrumbToReplay(breadcrumb, hint, options);
    }
    if (_isFetchBreadcrumb(breadcrumb) && _isFetchHint(hint)) {
      enrichFetchBreadcrumb(breadcrumb, hint);
      captureFetchBreadcrumbToReplay(breadcrumb, hint, options);
    }
  } catch (e2) {
    DEBUG_BUILD$1 && debug.exception(e2, "Error when enriching network breadcrumb");
  }
}
function _isXhrBreadcrumb(breadcrumb) {
  return breadcrumb.category === "xhr";
}
function _isFetchBreadcrumb(breadcrumb) {
  return breadcrumb.category === "fetch";
}
function _isXhrHint(hint) {
  return hint?.xhr;
}
function _isFetchHint(hint) {
  return hint?.input !== void 0;
}
function addGlobalListeners(replay) {
  const client = getClient();
  addClickKeypressInstrumentationHandler(handleDomListener(replay));
  addHistoryInstrumentationHandler(handleHistorySpanListener(replay));
  handleBreadcrumbs(replay);
  handleNetworkBreadcrumbs(replay);
  const eventProcessor = handleGlobalEventListener(replay);
  addEventProcessor(eventProcessor);
  if (client) {
    client.on("beforeSendEvent", handleBeforeSendEvent(replay));
    client.on("afterSendEvent", handleAfterSendEvent(replay));
    client.on("createDsc", (dsc) => {
      const replayId = replay.getSessionId();
      if (replayId && replay.isEnabled() && replay.recordingMode === "session") {
        const isSessionActive = replay.checkAndHandleExpiredSession();
        if (isSessionActive) {
          dsc.replay_id = replayId;
        }
      }
    });
    client.on("spanStart", (span) => {
      replay.lastActiveSpan = span;
    });
    client.on("spanEnd", (span) => {
      replay.lastActiveSpan = span;
    });
    client.on("beforeSendFeedback", async (feedbackEvent, options) => {
      const replayId = replay.getSessionId();
      if (options?.includeReplay && replay.isEnabled() && replayId && feedbackEvent.contexts?.feedback) {
        if (feedbackEvent.contexts.feedback.source === "api") {
          await replay.sendBufferedReplayOrFlush();
        }
        feedbackEvent.contexts.feedback.replay_id = replayId;
      }
    });
    client.on("openFeedbackWidget", async () => {
      await replay.sendBufferedReplayOrFlush();
    });
  }
}
async function addMemoryEntry(replay) {
  try {
    return Promise.all(
      createPerformanceSpans(replay, [
        // @ts-expect-error memory doesn't exist on type Performance as the API is non-standard (we check that it exists above)
        createMemoryEntry(WINDOW.performance.memory)
      ])
    );
  } catch {
    return [];
  }
}
function createMemoryEntry(memoryEntry) {
  const { jsHeapSizeLimit, totalJSHeapSize, usedJSHeapSize } = memoryEntry;
  const time = Date.now() / 1e3;
  return {
    type: "memory",
    name: "memory",
    start: time,
    end: time,
    data: {
      memory: {
        jsHeapSizeLimit,
        totalJSHeapSize,
        usedJSHeapSize
      }
    }
  };
}
function debounce(func, wait, options) {
  return debounce$1(func, wait, {
    ...options,
    // @ts-expect-error - Not quite sure why these types do not match, but this is fine
    setTimeoutImpl: setTimeout$3
  });
}
const NAVIGATOR = GLOBAL_OBJ.navigator;
function getRecordingSamplingOptions() {
  if (/iPhone|iPad|iPod/i.test(NAVIGATOR?.userAgent ?? "") || /Macintosh/i.test(NAVIGATOR?.userAgent ?? "") && NAVIGATOR?.maxTouchPoints && NAVIGATOR?.maxTouchPoints > 1) {
    return {
      sampling: {
        mousemove: false
      }
    };
  }
  return {};
}
function getHandleRecordingEmit(replay) {
  let hadFirstEvent = false;
  return (event, _isCheckout) => {
    if (!replay.checkAndHandleExpiredSession()) {
      DEBUG_BUILD$1 && debug.warn("Received replay event after session expired.");
      return;
    }
    const isCheckout = _isCheckout || !hadFirstEvent;
    hadFirstEvent = true;
    syncMirrorAttributesFromMutationEvent(event);
    if (replay.clickDetector) {
      updateClickDetectorForRecordingEvent(replay.clickDetector, event);
    }
    replay.addUpdate(() => {
      if (replay.recordingMode === "buffer" && isCheckout) {
        replay.setInitialState();
      }
      if (!addEventSync(replay, event, isCheckout)) {
        return true;
      }
      if (!isCheckout) {
        return false;
      }
      const session = replay.session;
      addSettingsEvent(replay, isCheckout);
      if (replay.recordingMode === "buffer" && session && replay.eventBuffer && !session.dirty) {
        const earliestEvent = replay.eventBuffer.getEarliestTimestamp();
        if (earliestEvent) {
          DEBUG_BUILD$1 && debug.log(`Updating session start time to earliest event in buffer to ${new Date(earliestEvent)}`);
          session.started = earliestEvent;
          if (replay.getOptions().stickySession) {
            saveSession(session);
          }
        }
      }
      if (session?.previousSessionId) {
        return true;
      }
      if (replay.recordingMode === "session") {
        void replay.flush();
      }
      return true;
    });
  };
}
function syncMirrorAttributesFromMutationEvent(event) {
  const data = event.data;
  if (event.type !== EventType.IncrementalSnapshot || !data || typeof data !== "object" || !("source" in data) || data.source !== IncrementalSource.Mutation || !("attributes" in data) || !Array.isArray(data.attributes)) {
    return;
  }
  for (const mutation of data.attributes) {
    const node = record.mirror.getNode(mutation.id);
    const meta = node && record.mirror.getMeta(node);
    if (meta?.type !== NodeType.Element) {
      continue;
    }
    for (const [attributeName, value] of Object.entries(mutation.attributes)) {
      if (value === null) {
        delete meta.attributes[attributeName];
      } else {
        meta.attributes[attributeName] = value;
      }
    }
  }
}
function createOptionsEvent(replay) {
  const options = replay.getOptions();
  return {
    type: EventType.Custom,
    timestamp: Date.now(),
    data: {
      tag: "options",
      payload: {
        shouldRecordCanvas: replay.isRecordingCanvas(),
        sessionSampleRate: options.sessionSampleRate,
        errorSampleRate: options.errorSampleRate,
        useCompressionOption: options.useCompression,
        blockAllMedia: options.blockAllMedia,
        maskAllText: options.maskAllText,
        maskAllInputs: options.maskAllInputs,
        useCompression: replay.eventBuffer ? replay.eventBuffer.type === "worker" : false,
        networkDetailHasUrls: options.networkDetailAllowUrls.length > 0,
        networkCaptureBodies: options.networkCaptureBodies,
        networkRequestHasHeaders: options.networkRequestHeaders.length > 0,
        networkResponseHasHeaders: options.networkResponseHeaders.length > 0
      }
    }
  };
}
function addSettingsEvent(replay, isCheckout) {
  if (!isCheckout || replay.session?.segmentId !== 0) {
    return;
  }
  addEventSync(replay, createOptionsEvent(replay), false);
}
function closestElementOfNode$2(node) {
  if (!node) {
    return null;
  }
  try {
    const el = node.nodeType === node.ELEMENT_NODE ? node : node.parentElement;
    return el;
  } catch {
    return null;
  }
}
function createReplayEnvelope(replayEvent, recordingData, dsn, tunnel) {
  return createEnvelope(
    createEventEnvelopeHeaders(replayEvent, getSdkMetadataForEnvelopeHeader(replayEvent), tunnel, dsn),
    [
      [{ type: "replay_event" }, replayEvent],
      [
        {
          type: "replay_recording",
          // If string then we need to encode to UTF8, otherwise will have
          // wrong size. TextEncoder has similar browser support to
          // MutationObserver, although it does not accept IE11.
          length: typeof recordingData === "string" ? new TextEncoder().encode(recordingData).length : recordingData.length
        },
        recordingData
      ]
    ]
  );
}
function prepareRecordingData({
  recordingData,
  headers
}) {
  let payloadWithSequence;
  const replayHeaders = `${JSON.stringify(headers)}
`;
  if (typeof recordingData === "string") {
    payloadWithSequence = `${replayHeaders}${recordingData}`;
  } else {
    const enc = new TextEncoder();
    const sequence = enc.encode(replayHeaders);
    payloadWithSequence = new Uint8Array(sequence.length + recordingData.length);
    payloadWithSequence.set(sequence);
    payloadWithSequence.set(recordingData, sequence.length);
  }
  return payloadWithSequence;
}
async function prepareReplayEvent({
  client,
  scope,
  replayId: event_id,
  event
}) {
  const integrations = typeof client["_integrations"] === "object" && client["_integrations"] !== null && !Array.isArray(client["_integrations"]) ? Object.keys(client["_integrations"]) : void 0;
  const eventHint = { event_id, integrations };
  client.emit("preprocessEvent", event, eventHint);
  const preparedEvent = await prepareEvent(
    client.getOptions(),
    event,
    eventHint,
    scope,
    client,
    getIsolationScope()
  );
  if (!preparedEvent) {
    return null;
  }
  client.emit("postprocessEvent", preparedEvent, eventHint);
  preparedEvent.platform = preparedEvent.platform || "javascript";
  const metadata = client.getSdkMetadata();
  const { name, version, settings } = metadata?.sdk || {};
  preparedEvent.sdk = {
    ...preparedEvent.sdk,
    name: name || "sentry.javascript.unknown",
    version: version || "0.0.0",
    settings
  };
  return preparedEvent;
}
async function sendReplayRequest({
  recordingData,
  replayId,
  segmentId: segment_id,
  eventContext,
  timestamp,
  session
}) {
  const preparedRecordingData = prepareRecordingData({
    recordingData,
    headers: {
      segment_id
    }
  });
  const { urls, errorIds, traceIds, initialTimestamp } = eventContext;
  const client = getClient();
  const scope = getCurrentScope();
  const transport = client?.getTransport();
  const dsn = client?.getDsn();
  if (!client || !transport || !dsn || !session.sampled) {
    return Promise.resolve({});
  }
  const baseEvent = {
    type: REPLAY_EVENT_NAME,
    replay_start_timestamp: initialTimestamp / 1e3,
    timestamp: timestamp / 1e3,
    error_ids: errorIds,
    trace_ids: traceIds,
    urls,
    replay_id: replayId,
    segment_id,
    replay_type: session.sampled
  };
  const replayEvent = await prepareReplayEvent({ scope, client, replayId, event: baseEvent });
  if (!replayEvent) {
    client.recordDroppedEvent("event_processor", "replay");
    DEBUG_BUILD$1 && debug.log("An event processor returned `null`, will not send event.");
    return Promise.resolve({});
  }
  delete replayEvent.sdkProcessingMetadata;
  const envelope = createReplayEnvelope(replayEvent, preparedRecordingData, dsn, client.getOptions().tunnel);
  let response;
  try {
    response = await transport.send(envelope);
  } catch (err) {
    const error2 = new Error(UNABLE_TO_SEND_REPLAY);
    try {
      error2.cause = err;
    } catch {
    }
    throw error2;
  }
  const rateLimits = updateRateLimits({}, response);
  if (isRateLimited(rateLimits, "replay")) {
    throw new RateLimitError(rateLimits);
  }
  if (typeof response.statusCode === "number" && (response.statusCode < 200 || response.statusCode >= 300)) {
    throw new TransportStatusCodeError(response.statusCode);
  }
  return response;
}
class TransportStatusCodeError extends Error {
  constructor(statusCode) {
    super(`Transport returned status code ${statusCode}`);
  }
}
class RateLimitError extends Error {
  constructor(rateLimits) {
    super("Rate limit hit");
    this.rateLimits = rateLimits;
  }
}
class ReplayDurationLimitError extends Error {
  constructor() {
    super("Session is too long, not sending replay");
  }
}
async function sendReplay(replayData, retryConfig = {
  count: 0,
  interval: RETRY_BASE_INTERVAL
}) {
  const { recordingData, onError } = replayData;
  if (!recordingData.length) {
    return;
  }
  try {
    await sendReplayRequest(replayData);
    return true;
  } catch (err) {
    if (err instanceof TransportStatusCodeError || err instanceof RateLimitError) {
      throw err;
    }
    setContext("Replays", {
      _retryCount: retryConfig.count
    });
    if (onError) {
      onError(err);
    }
    if (retryConfig.count >= RETRY_MAX_COUNT) {
      const error2 = new Error(`${UNABLE_TO_SEND_REPLAY} - max retries exceeded`);
      try {
        error2.cause = err;
      } catch {
      }
      throw error2;
    }
    retryConfig.interval *= ++retryConfig.count;
    return new Promise((resolve, reject) => {
      setTimeout$3(async () => {
        try {
          await sendReplay(replayData, retryConfig);
          resolve(true);
        } catch (err2) {
          reject(err2);
        }
      }, retryConfig.interval);
    });
  }
}
const THROTTLED = "__THROTTLED";
const SKIPPED = "__SKIPPED";
function throttle(fn, maxCount, durationSeconds) {
  const counter = /* @__PURE__ */ new Map();
  const _cleanup = (now) => {
    const threshold = now - durationSeconds;
    counter.forEach((_value, key) => {
      if (key < threshold) {
        counter.delete(key);
      }
    });
  };
  const _getTotalCount = () => {
    return [...counter.values()].reduce((a2, b2) => a2 + b2, 0);
  };
  let isThrottled = false;
  return (...rest) => {
    const now = Math.floor(Date.now() / 1e3);
    _cleanup(now);
    if (_getTotalCount() >= maxCount) {
      const wasThrottled = isThrottled;
      isThrottled = true;
      return wasThrottled ? SKIPPED : THROTTLED;
    }
    isThrottled = false;
    const count2 = counter.get(now) || 0;
    counter.set(now, count2 + 1);
    return fn(...rest);
  };
}
class ReplayContainer {
  constructor({
    options,
    recordingOptions
  }) {
    this.eventBuffer = null;
    this.performanceEntries = [];
    this.replayPerformanceEntries = [];
    this.recordingMode = "session";
    this.timeouts = {
      sessionIdlePause: SESSION_IDLE_PAUSE_DURATION,
      sessionIdleExpire: SESSION_IDLE_EXPIRE_DURATION
    };
    this._lastActivity = Date.now();
    this._isEnabled = false;
    this._isPaused = false;
    this._requiresManualStart = false;
    this._hasInitializedCoreListeners = false;
    this._context = {
      errorIds: /* @__PURE__ */ new Set(),
      traceIds: /* @__PURE__ */ new Set(),
      urls: [],
      initialTimestamp: Date.now(),
      initialUrl: ""
    };
    this._recordingOptions = recordingOptions;
    this._options = options;
    this._debouncedFlush = debounce(() => this._flush(), this._options.flushMinDelay, {
      maxWait: this._options.flushMaxDelay
    });
    this._throttledAddEvent = throttle(
      (event, isCheckout) => addEvent(this, event, isCheckout),
      // Max 300 events...
      300,
      // ... per 5s
      5
    );
    const { slowClickTimeout, slowClickIgnoreSelectors } = this.getOptions();
    const slowClickConfig = slowClickTimeout ? {
      threshold: Math.min(SLOW_CLICK_THRESHOLD, slowClickTimeout),
      timeout: slowClickTimeout,
      scrollTimeout: SLOW_CLICK_SCROLL_TIMEOUT,
      ignoreSelector: slowClickIgnoreSelectors ? slowClickIgnoreSelectors.join(",") : ""
    } : void 0;
    if (slowClickConfig) {
      this.clickDetector = new ClickDetector(this, slowClickConfig);
    }
    if (DEBUG_BUILD$1) {
      const experiments = options._experiments;
      debug.setConfig({
        captureExceptions: !!experiments.captureExceptions,
        traceInternals: !!experiments.traceInternals
      });
    }
    this._handleVisibilityChange = () => {
      if (WINDOW.document.visibilityState === "visible") {
        this._doChangeToForegroundTasks();
      } else {
        this._doChangeToBackgroundTasks();
      }
    };
    this._handleWindowBlur = () => {
      const breadcrumb = createBreadcrumb({
        category: "ui.blur"
      });
      this._doChangeToBackgroundTasks(breadcrumb);
    };
    this._handleWindowFocus = () => {
      const breadcrumb = createBreadcrumb({
        category: "ui.focus"
      });
      this._doChangeToForegroundTasks(breadcrumb);
    };
    this._handleKeyboardEvent = (event) => {
      handleKeyboardEvent(this, event);
    };
  }
  /** Get the event context. */
  getContext() {
    return this._context;
  }
  /** If recording is currently enabled. */
  isEnabled() {
    return this._isEnabled;
  }
  /** If recording is currently paused. */
  isPaused() {
    return this._isPaused;
  }
  /**
   * Determine if canvas recording is enabled
   */
  isRecordingCanvas() {
    return Boolean(this._canvas);
  }
  /** Get the replay integration options. */
  getOptions() {
    return this._options;
  }
  /** A wrapper to conditionally capture exceptions. */
  handleException(error2) {
    DEBUG_BUILD$1 && debug.exception(error2);
    if (this._options.onError) {
      this._options.onError(error2);
    }
  }
  /**
   * Initializes the plugin based on sampling configuration. Should not be
   * called outside of constructor.
   */
  initializeSampling(previousSessionId) {
    const { errorSampleRate, sessionSampleRate } = this._options;
    const requiresManualStart = errorSampleRate <= 0 && sessionSampleRate <= 0;
    this._requiresManualStart = requiresManualStart;
    if (requiresManualStart) {
      return;
    }
    this._initializeSessionForSampling(previousSessionId);
    if (!this.session) {
      DEBUG_BUILD$1 && debug.exception(new Error("Unable to initialize and create session"));
      return;
    }
    if (this.session.sampled === false) {
      return;
    }
    this.recordingMode = this.session.sampled === "buffer" && this.session.segmentId === 0 ? "buffer" : "session";
    DEBUG_BUILD$1 && debug.infoTick(`Starting replay in ${this.recordingMode} mode`);
    this._initializeRecording();
  }
  /**
   * Start a replay regardless of sampling rate. Calling this will always
   * create a new session. Will log a message if replay is already in progress.
   *
   * Creates or loads a session, attaches listeners to varying events (DOM,
   * _performanceObserver, Recording, Sentry SDK, etc)
   */
  start() {
    if (this._isEnabled && this.recordingMode === "session") {
      DEBUG_BUILD$1 && debug.log("Recording is already in progress");
      return;
    }
    if (this._isEnabled && this.recordingMode === "buffer") {
      DEBUG_BUILD$1 && debug.log("Buffering is in progress, call `flush()` to save the replay");
      return;
    }
    DEBUG_BUILD$1 && debug.infoTick("Starting replay in session mode");
    this._updateUserActivity();
    const session = loadOrCreateSession(
      {
        maxReplayDuration: this._options.maxReplayDuration,
        sessionIdleExpire: this.timeouts.sessionIdleExpire
      },
      {
        stickySession: this._options.stickySession,
        // This is intentional: create a new session-based replay when calling `start()`
        sessionSampleRate: 1,
        allowBuffering: false
      }
    );
    this.session = session;
    this.recordingMode = "session";
    this._initializeRecording();
  }
  /**
   * Start replay buffering. Buffers until `flush()` is called or, if
   * `replaysOnErrorSampleRate` > 0, an error occurs.
   */
  startBuffering() {
    if (this._isEnabled) {
      DEBUG_BUILD$1 && debug.log("Buffering is in progress, call `flush()` to save the replay");
      return;
    }
    DEBUG_BUILD$1 && debug.infoTick("Starting replay in buffer mode");
    const session = loadOrCreateSession(
      {
        sessionIdleExpire: this.timeouts.sessionIdleExpire,
        maxReplayDuration: this._options.maxReplayDuration
      },
      {
        stickySession: this._options.stickySession,
        sessionSampleRate: 0,
        allowBuffering: true
      }
    );
    this.session = session;
    this.recordingMode = "buffer";
    this._initializeRecording();
  }
  /**
   * Start recording.
   *
   * Note that this will cause a new DOM checkout
   */
  startRecording() {
    try {
      const canvasOptions = this._canvas;
      this._stopRecording = record({
        ...this._recordingOptions,
        // When running in error sampling mode, we need to overwrite `checkoutEveryNms`
        // Without this, it would record forever, until an error happens, which we don't want
        // instead, we'll always keep the last 60 seconds of replay before an error happened
        ...this.recordingMode === "buffer" ? { checkoutEveryNms: BUFFER_CHECKOUT_TIME } : (
          // Otherwise, use experimental option w/ min checkout time of 6 minutes
          // This is to improve playback seeking as there could potentially be
          // less mutations to process in the worse cases.
          //
          // checkout by "N" events is probably ideal, but means we have less
          // control about the number of checkouts we make (which generally
          // increases replay size)
          this._options._experiments.continuousCheckout && {
            // Minimum checkout time is 6 minutes
            checkoutEveryNms: Math.max(36e4, this._options._experiments.continuousCheckout)
          }
        ),
        emit: getHandleRecordingEmit(this),
        ...getRecordingSamplingOptions(),
        onMutation: this._onMutationHandler.bind(this),
        ...canvasOptions ? {
          recordCanvas: canvasOptions.recordCanvas,
          getCanvasManager: canvasOptions.getCanvasManager,
          sampling: canvasOptions.sampling,
          dataURLOptions: canvasOptions.dataURLOptions
        } : {}
      });
    } catch (err) {
      this.handleException(err);
    }
  }
  /**
   * Stops the recording, if it was running.
   *
   * Returns true if it was previously stopped, or is now stopped,
   * otherwise false.
   */
  stopRecording() {
    try {
      if (this._stopRecording) {
        this._stopRecording();
        this._stopRecording = void 0;
      }
      return true;
    } catch (err) {
      this.handleException(err);
      return false;
    }
  }
  /**
   * Currently, this needs to be manually called (e.g. for tests). Sentry SDK
   * does not support a teardown
   */
  async stop({
    forceFlush = false,
    reason
  } = {}) {
    if (!this._isEnabled) {
      return;
    }
    this._isEnabled = false;
    this.recordingMode = "buffer";
    const stopReason = reason ?? "manual";
    getClient()?.emit("replayEnd", { sessionId: this.session?.id, reason: stopReason });
    try {
      DEBUG_BUILD$1 && debug.log(`Stopping Replay triggered by ${stopReason}`);
      resetReplayIdOnDynamicSamplingContext();
      this._removeListeners();
      this.stopRecording();
      this._debouncedFlush.cancel();
      if (forceFlush) {
        await this._flush({ force: true });
      }
      this.eventBuffer?.destroy();
      this.eventBuffer = null;
      clearSession(this);
    } catch (err) {
      this.handleException(err);
    }
  }
  /**
   * Pause some replay functionality. See comments for `_isPaused`.
   * This differs from stop as this only stops DOM recording, it is
   * not as thorough of a shutdown as `stop()`.
   */
  pause() {
    if (this._isPaused) {
      return;
    }
    this._isPaused = true;
    this.stopRecording();
    DEBUG_BUILD$1 && debug.log("Pausing replay");
  }
  /**
   * Resumes recording, see notes for `pause().
   *
   * Note that calling `startRecording()` here will cause a
   * new DOM checkout.`
   */
  resume() {
    if (!this._isPaused || !this._checkSession()) {
      return;
    }
    this._isPaused = false;
    this.startRecording();
    DEBUG_BUILD$1 && debug.log("Resuming replay");
  }
  /**
   * If not in "session" recording mode, flush event buffer which will create a new replay.
   * Unless `continueRecording` is false, the replay will continue to record and
   * behave as a "session"-based replay.
   *
   * Otherwise, queue up a flush.
   */
  async sendBufferedReplayOrFlush({ continueRecording = true } = {}) {
    if (this.recordingMode === "session") {
      return this.flushImmediate();
    }
    const activityTime = Date.now();
    DEBUG_BUILD$1 && debug.log("Converting buffer to session");
    await this.flushImmediate();
    const hasStoppedRecording = this.stopRecording();
    if (!continueRecording || !hasStoppedRecording) {
      return;
    }
    if (this.recordingMode === "session") {
      return;
    }
    this.recordingMode = "session";
    if (this.session) {
      this.session.dirty = false;
      this._updateUserActivity(activityTime);
      this._updateSessionActivity(activityTime);
      this._maybeSaveSession();
      setReplayIdOnDynamicSamplingContext(this.session.id);
    }
    this.startRecording();
  }
  /**
   * We want to batch uploads of replay events. Save events only if
   * `<flushMinDelay>` milliseconds have elapsed since the last event
   * *OR* if `<flushMaxDelay>` milliseconds have elapsed.
   *
   * Accepts a callback to perform side-effects and returns true to stop batch
   * processing and hand back control to caller.
   */
  addUpdate(cb) {
    const cbResult = cb();
    if (this.recordingMode === "buffer" || !this._isEnabled) {
      return;
    }
    if (cbResult === true) {
      return;
    }
    this._debouncedFlush();
  }
  /**
   * Updates the user activity timestamp and resumes recording. This should be
   * called in an event handler for a user action that we consider as the user
   * being "active" (e.g. a mouse click).
   */
  triggerUserActivity() {
    this._updateUserActivity();
    if (!this._stopRecording) {
      if (!this._checkSession()) {
        return;
      }
      this.resume();
      return;
    }
    this.checkAndHandleExpiredSession();
    this._updateSessionActivity();
  }
  /**
   * Updates the user activity timestamp *without* resuming
   * recording. Some user events (e.g. keydown) can be create
   * low-value replays that only contain the keypress as a
   * breadcrumb. Instead this would require other events to
   * create a new replay after a session has expired.
   */
  updateUserActivity() {
    this._updateUserActivity();
    this._updateSessionActivity();
  }
  /**
   * Only flush if `this.recordingMode === 'session'`
   */
  conditionalFlush() {
    if (this.recordingMode === "buffer") {
      return Promise.resolve();
    }
    return this.flushImmediate();
  }
  /**
   * Flush using debounce flush
   */
  flush() {
    return this._debouncedFlush();
  }
  /**
   * Always flush via `_debouncedFlush` so that we do not have flushes triggered
   * from calling both `flush` and `_debouncedFlush`. Otherwise, there could be
   * cases of multiple flushes happening closely together.
   */
  flushImmediate() {
    this._debouncedFlush();
    return this._debouncedFlush.flush();
  }
  /**
   * Cancels queued up flushes.
   */
  cancelFlush() {
    this._debouncedFlush.cancel();
  }
  /** Get the current session (=replay) ID
   *
   * @param onlyIfSampled - If true, will only return the session ID if the session is sampled.
   */
  getSessionId(onlyIfSampled) {
    if (onlyIfSampled && this.session?.sampled === false) {
      return void 0;
    }
    return this.session?.id;
  }
  /**
   * Checks if recording should be stopped due to user inactivity. Otherwise
   * check if session is expired and create a new session if so. Triggers a new
   * full snapshot on new session.
   *
   * Returns true if session is not expired, false otherwise.
   * @hidden
   */
  checkAndHandleExpiredSession() {
    if (this._lastActivity && isExpired(this._lastActivity, this.timeouts.sessionIdlePause) && this.session?.sampled === "session") {
      this.pause();
      return;
    }
    if (!this._checkSession()) {
      return false;
    }
    return true;
  }
  /**
   * Capture some initial state that can change throughout the lifespan of the
   * replay. This is required because otherwise they would be captured at the
   * first flush.
   */
  setInitialState() {
    const urlPath = `${WINDOW.location.pathname}${WINDOW.location.hash}${WINDOW.location.search}`;
    const url = `${WINDOW.location.origin}${urlPath}`;
    this.performanceEntries = [];
    this.replayPerformanceEntries = [];
    this._clearContext();
    this._context.initialUrl = url;
    this._context.initialTimestamp = Date.now();
    this._context.urls.push(url);
  }
  /**
   * Add a breadcrumb event, that may be throttled.
   * If it was throttled, we add a custom breadcrumb to indicate that.
   */
  throttledAddEvent(event, isCheckout) {
    const res = this._throttledAddEvent(event, isCheckout);
    if (res === THROTTLED) {
      const breadcrumb = createBreadcrumb({
        category: "replay.throttled"
      });
      this.addUpdate(() => {
        return !addEventSync(this, {
          type: ReplayEventTypeCustom,
          timestamp: breadcrumb.timestamp || 0,
          data: {
            tag: "breadcrumb",
            payload: breadcrumb,
            metric: true
          }
        });
      });
    }
    return res;
  }
  /**
   * This will get the parametrized route name of the current page.
   * This is only available if performance is enabled, and if an instrumented router is used.
   */
  getCurrentRoute() {
    const lastActiveSpan = this.lastActiveSpan || getActiveSpan();
    const lastRootSpan = lastActiveSpan && getRootSpan(lastActiveSpan);
    const attributes = lastRootSpan && spanToJSON(lastRootSpan).data || {};
    const source = attributes[SEMANTIC_ATTRIBUTE_SENTRY_SOURCE];
    if (!lastRootSpan || !source || !["route", "custom"].includes(source)) {
      return void 0;
    }
    return spanToJSON(lastRootSpan).description;
  }
  /**
   * Initialize and start all listeners to varying events (DOM,
   * Performance Observer, Recording, Sentry SDK, etc)
   */
  _initializeRecording() {
    this.setInitialState();
    this._updateSessionActivity();
    this.eventBuffer = createEventBuffer({
      useCompression: this._options.useCompression,
      workerUrl: this._options.workerUrl
    });
    this._removeListeners();
    this._addListeners();
    this._isEnabled = true;
    this._isPaused = false;
    if (this.session) {
      getClient()?.emit("replayStart", {
        sessionId: this.session.id,
        recordingMode: this.recordingMode
      });
    }
    this.startRecording();
    if (this.recordingMode === "session" && this.session) {
      setReplayIdOnDynamicSamplingContext(this.session.id);
    }
  }
  /**
   * Loads (or refreshes) the current session.
   */
  _initializeSessionForSampling(previousSessionId) {
    const allowBuffering = this._options.errorSampleRate > 0;
    const session = loadOrCreateSession(
      {
        sessionIdleExpire: this.timeouts.sessionIdleExpire,
        maxReplayDuration: this._options.maxReplayDuration,
        previousSessionId
      },
      {
        stickySession: this._options.stickySession,
        sessionSampleRate: this._options.sessionSampleRate,
        allowBuffering
      }
    );
    this.session = session;
  }
  /**
   * Checks and potentially refreshes the current session.
   * Returns false if session is not recorded.
   */
  _checkSession() {
    if (!this.session) {
      return false;
    }
    const currentSession = this.session;
    if (shouldRefreshSession(currentSession, {
      sessionIdleExpire: this.timeouts.sessionIdleExpire,
      maxReplayDuration: this._options.maxReplayDuration
    })) {
      this._refreshSession(currentSession);
      return false;
    }
    return true;
  }
  /**
   * Refresh a session with a new one.
   * This stops the current session (without forcing a flush, as that would never work since we are expired),
   * and then does a new sampling based on the refreshed session.
   */
  async _refreshSession(session) {
    if (!this._isEnabled) {
      return;
    }
    await this.stop({ reason: "sessionExpired" });
    this.initializeSampling(session.id);
  }
  /**
   * Adds listeners to record events for the replay
   */
  _addListeners() {
    try {
      WINDOW.document.addEventListener("visibilitychange", this._handleVisibilityChange);
      WINDOW.addEventListener("blur", this._handleWindowBlur);
      WINDOW.addEventListener("focus", this._handleWindowFocus);
      WINDOW.addEventListener("keydown", this._handleKeyboardEvent);
      if (this.clickDetector) {
        this.clickDetector.addListeners();
      }
      if (!this._hasInitializedCoreListeners) {
        addGlobalListeners(this);
        this._hasInitializedCoreListeners = true;
      }
    } catch (err) {
      this.handleException(err);
    }
    this._performanceCleanupCallback = setupPerformanceObserver(this);
  }
  /**
   * Cleans up listeners that were created in `_addListeners`
   */
  _removeListeners() {
    try {
      WINDOW.document.removeEventListener("visibilitychange", this._handleVisibilityChange);
      WINDOW.removeEventListener("blur", this._handleWindowBlur);
      WINDOW.removeEventListener("focus", this._handleWindowFocus);
      WINDOW.removeEventListener("keydown", this._handleKeyboardEvent);
      if (this.clickDetector) {
        this.clickDetector.removeListeners();
      }
      if (this._performanceCleanupCallback) {
        this._performanceCleanupCallback();
      }
    } catch (err) {
      this.handleException(err);
    }
  }
  /**
   * Tasks to run when we consider a page to be hidden (via blurring and/or visibility)
   */
  _doChangeToBackgroundTasks(breadcrumb) {
    if (!this.session) {
      return;
    }
    const expired = shouldRefreshSession(this.session, {
      maxReplayDuration: this._options.maxReplayDuration,
      sessionIdleExpire: this.timeouts.sessionIdleExpire
    });
    if (expired) {
      resetReplayIdOnDynamicSamplingContext();
      return;
    }
    if (breadcrumb) {
      this._createCustomBreadcrumb(breadcrumb);
    }
    void this.conditionalFlush();
  }
  /**
   * Tasks to run when we consider a page to be visible (via focus and/or visibility)
   */
  _doChangeToForegroundTasks(breadcrumb) {
    if (!this.session) {
      return;
    }
    const isSessionActive = this.checkAndHandleExpiredSession();
    if (!isSessionActive) {
      DEBUG_BUILD$1 && debug.log("Document has become active, but session has expired");
      return;
    }
    if (breadcrumb) {
      this._createCustomBreadcrumb(breadcrumb);
    }
  }
  /**
   * Update user activity (across session lifespans)
   */
  _updateUserActivity(_lastActivity = Date.now()) {
    this._lastActivity = _lastActivity;
  }
  /**
   * Updates the session's last activity timestamp
   */
  _updateSessionActivity(_lastActivity = Date.now()) {
    if (this.session) {
      this.session.lastActivity = _lastActivity;
      this._maybeSaveSession();
    }
  }
  /**
   * Helper to create (and buffer) a replay breadcrumb from a core SDK breadcrumb
   */
  _createCustomBreadcrumb(breadcrumb) {
    this.addUpdate(() => {
      this.throttledAddEvent({
        type: EventType.Custom,
        timestamp: breadcrumb.timestamp || 0,
        data: {
          tag: "breadcrumb",
          payload: breadcrumb
        }
      });
    });
  }
  /**
   * Observed performance events are added to `this.performanceEntries`. These
   * are included in the replay event before it is finished and sent to Sentry.
   */
  _addPerformanceEntries() {
    let performanceEntries = createPerformanceEntries(this.performanceEntries).concat(this.replayPerformanceEntries);
    this.performanceEntries = [];
    this.replayPerformanceEntries = [];
    if (this._requiresManualStart) {
      const initialTimestampInSeconds = this._context.initialTimestamp / 1e3;
      performanceEntries = performanceEntries.filter((entry) => entry.start >= initialTimestampInSeconds);
    }
    return Promise.all(createPerformanceSpans(this, performanceEntries));
  }
  /**
   * Clear _context
   */
  _clearContext() {
    this._context.errorIds.clear();
    this._context.traceIds.clear();
    this._context.urls = [];
  }
  /** Update the initial timestamp based on the buffer content. */
  _updateInitialTimestampFromEventBuffer() {
    const { session, eventBuffer } = this;
    if (!session || !eventBuffer || this._requiresManualStart) {
      return;
    }
    if (session.segmentId) {
      return;
    }
    const earliestEvent = eventBuffer.getEarliestTimestamp();
    if (earliestEvent && earliestEvent < this._context.initialTimestamp) {
      this._context.initialTimestamp = earliestEvent;
    }
  }
  /**
   * Return and clear _context
   */
  _popEventContext() {
    const _context = {
      initialTimestamp: this._context.initialTimestamp,
      initialUrl: this._context.initialUrl,
      errorIds: Array.from(this._context.errorIds),
      traceIds: Array.from(this._context.traceIds),
      urls: this._context.urls
    };
    this._clearContext();
    return _context;
  }
  /**
   * Flushes replay event buffer to Sentry.
   *
   * Performance events are only added right before flushing - this is
   * due to the buffered performance observer events.
   *
   * Should never be called directly, only by `flush`
   */
  async _runFlush() {
    const replayId = this.getSessionId();
    if (!this.session || !this.eventBuffer || !replayId) {
      DEBUG_BUILD$1 && debug.error("No session or eventBuffer found to flush.");
      return;
    }
    await this._addPerformanceEntries();
    if (!this.eventBuffer?.hasEvents) {
      return;
    }
    await addMemoryEntry(this);
    if (!this.eventBuffer) {
      return;
    }
    if (replayId !== this.getSessionId()) {
      return;
    }
    try {
      this._updateInitialTimestampFromEventBuffer();
      const timestamp = Date.now();
      if (timestamp - this._context.initialTimestamp > this._options.maxReplayDuration + 3e4) {
        throw new ReplayDurationLimitError();
      }
      const eventContext = this._popEventContext();
      const segmentId = this.session.segmentId++;
      this._maybeSaveSession();
      const recordingData = await this.eventBuffer.finish();
      await sendReplay({
        replayId,
        recordingData,
        segmentId,
        eventContext,
        session: this.session,
        timestamp,
        onError: (err) => this.handleException(err)
      });
    } catch (err) {
      this.handleException(err);
      this.stop({ reason: "sendError" });
      const client = getClient();
      if (client) {
        let dropReason;
        if (err instanceof RateLimitError) {
          dropReason = "ratelimit_backoff";
        } else if (err instanceof ReplayDurationLimitError) {
          dropReason = "invalid";
        } else {
          dropReason = "send_error";
        }
        client.recordDroppedEvent(dropReason, "replay");
      }
    }
  }
  /**
   * Flush recording data to Sentry. Creates a lock so that only a single flush
   * can be active at a time. Do not call this directly.
   */
  async _flush({
    force = false
  } = {}) {
    if (!this._isEnabled && !force) {
      return;
    }
    if (!this.checkAndHandleExpiredSession()) {
      DEBUG_BUILD$1 && debug.error("Attempting to finish replay event after session expired.");
      return;
    }
    if (!this.session) {
      return;
    }
    const start = this.session.started;
    const now = Date.now();
    const duration = now - start;
    this._debouncedFlush.cancel();
    const tooShort = duration < this._options.minReplayDuration;
    const tooLong = duration > this._options.maxReplayDuration + 5e3;
    if (tooShort || tooLong) {
      DEBUG_BUILD$1 && debug.log(
        `Session duration (${Math.floor(duration / 1e3)}s) is too ${tooShort ? "short" : "long"}, not sending replay.`
      );
      if (tooShort) {
        this._debouncedFlush();
      }
      return;
    }
    const eventBuffer = this.eventBuffer;
    if (eventBuffer && this.session.segmentId === 0 && !eventBuffer.hasCheckout) {
      DEBUG_BUILD$1 && debug.log("Flushing initial segment without checkout.");
    }
    const _flushInProgress = !!this._flushLock;
    if (!this._flushLock) {
      this._flushLock = this._runFlush();
    }
    try {
      await this._flushLock;
    } catch (err) {
      this.handleException(err);
    } finally {
      this._flushLock = void 0;
      if (_flushInProgress) {
        this._debouncedFlush();
      }
    }
  }
  /** Save the session, if it is sticky */
  _maybeSaveSession() {
    if (this.session && this._options.stickySession) {
      saveSession(this.session);
    }
  }
  /** Handler for rrweb.record.onMutation */
  _onMutationHandler(mutations) {
    const { ignoreMutations } = this._options._experiments;
    if (ignoreMutations?.length) {
      if (mutations.some((mutation) => {
        const el = closestElementOfNode$2(mutation.target);
        const selector = ignoreMutations.join(",");
        return el?.matches(selector);
      })) {
        return false;
      }
    }
    const count2 = mutations.length;
    const mutationLimit = this._options.mutationLimit;
    const mutationBreadcrumbLimit = this._options.mutationBreadcrumbLimit;
    const overMutationLimit = mutationLimit && count2 > mutationLimit;
    if (count2 > mutationBreadcrumbLimit || overMutationLimit) {
      const breadcrumb = createBreadcrumb({
        category: "replay.mutations",
        data: {
          count: count2,
          limit: overMutationLimit
        }
      });
      this._createCustomBreadcrumb(breadcrumb);
    }
    if (overMutationLimit) {
      this.stop({ reason: "mutationLimit", forceFlush: this.recordingMode === "session" });
      return false;
    }
    return true;
  }
}
function getOption(selectors, defaultSelectors) {
  return [
    ...selectors,
    // sentry defaults
    ...defaultSelectors
  ].join(",");
}
function getPrivacyOptions({ mask, unmask, block, unblock, ignore }) {
  const defaultBlockedElements = ["base", "iframe[srcdoc]:not([src])"];
  const maskSelector = getOption(mask, [".sentry-mask", "[data-sentry-mask]"]);
  const unmaskSelector = getOption(unmask, []);
  const options = {
    // We are making the decision to make text and input selectors the same
    maskTextSelector: maskSelector,
    unmaskTextSelector: unmaskSelector,
    blockSelector: getOption(block, [".sentry-block", "[data-sentry-block]", ...defaultBlockedElements]),
    unblockSelector: getOption(unblock, []),
    ignoreSelector: getOption(ignore, [".sentry-ignore", "[data-sentry-ignore]", 'input[type="file"]'])
  };
  return options;
}
function maskAttribute({
  el,
  key,
  maskAttributes,
  maskAllText,
  privacyOptions,
  value
}) {
  if (privacyOptions.unmaskTextSelector && el.matches(privacyOptions.unmaskTextSelector)) {
    return value;
  }
  const masksNamedAttribute = maskAttributes.includes(key);
  const masksSubmitButtonValue = maskAllText && key === "value" && el.tagName === "INPUT" && ["submit", "button"].includes(el.getAttribute("type") || "");
  if (masksNamedAttribute || masksSubmitButtonValue) {
    return value.replace(/[\S]/g, "*");
  }
  return value;
}
const MEDIA_SELECTORS = 'img,image,svg,video,object,picture,embed,map,audio,link[rel="icon"],link[rel="apple-touch-icon"]';
const DEFAULT_NETWORK_HEADERS = ["content-length", "content-type", "accept"];
const ORIGINAL_BODY = /* @__PURE__ */ Symbol.for("sentry__originalRequestBody");
let _initialized = false;
let _isRequestInstrumented = false;
function _INTERNAL_instrumentRequestInterface() {
  if (typeof Request === "undefined" || _isRequestInstrumented) {
    return;
  }
  const OriginalRequest = Request;
  try {
    const SentryRequest = function(input, init2) {
      const request = new OriginalRequest(input, init2);
      if (init2?.body != null) {
        request[ORIGINAL_BODY] = init2.body;
      }
      return request;
    };
    SentryRequest.prototype = OriginalRequest.prototype;
    GLOBAL_OBJ.Request = SentryRequest;
    _isRequestInstrumented = true;
  } catch {
  }
}
const replayIntegration = ((options) => {
  return new Replay(options);
});
class Replay {
  constructor({
    flushMinDelay = DEFAULT_FLUSH_MIN_DELAY,
    flushMaxDelay = DEFAULT_FLUSH_MAX_DELAY,
    minReplayDuration = MIN_REPLAY_DURATION,
    maxReplayDuration = MAX_REPLAY_DURATION,
    stickySession = true,
    useCompression = true,
    workerUrl,
    _experiments = {},
    maskAllText = true,
    maskAllInputs = true,
    blockAllMedia = true,
    mutationBreadcrumbLimit = 750,
    mutationLimit = 1e4,
    slowClickTimeout = 7e3,
    slowClickIgnoreSelectors = [],
    networkDetailAllowUrls = [],
    networkDetailDenyUrls = [],
    networkCaptureBodies = true,
    networkRequestHeaders = [],
    networkResponseHeaders = [],
    mask = [],
    maskAttributes = ["title", "placeholder", "aria-label"],
    unmask = [],
    block = [],
    unblock = [],
    ignore = [],
    maskFn,
    beforeAddRecordingEvent,
    beforeErrorSampling,
    onError,
    attachRawBodyFromRequest = false
  } = {}) {
    this.name = "Replay";
    const privacyOptions = getPrivacyOptions({
      mask,
      unmask,
      block,
      unblock,
      ignore
    });
    this._recordingOptions = {
      maskAllInputs,
      maskAllText,
      maskInputOptions: { password: true },
      maskTextFn: maskFn,
      maskInputFn: maskFn,
      maskAttributeFn: (key, value, el) => maskAttribute({
        maskAttributes,
        maskAllText,
        privacyOptions,
        key,
        value,
        el
      }),
      ...privacyOptions,
      // Our defaults
      slimDOMOptions: "all",
      inlineStylesheet: true,
      // Disable inline images as it will increase segment/replay size
      inlineImages: false,
      // collect fonts, but be aware that `sentry.io` needs to be an allowed
      // origin for playback
      collectFonts: true,
      errorHandler: (err) => {
        try {
          err.__rrweb__ = true;
        } catch {
        }
      },
      // experimental support for recording iframes from different origins
      recordCrossOriginIframes: Boolean(_experiments.recordCrossOriginIframes)
    };
    this._initialOptions = {
      flushMinDelay,
      flushMaxDelay,
      minReplayDuration: Math.min(minReplayDuration, MIN_REPLAY_DURATION_LIMIT),
      maxReplayDuration: Math.min(maxReplayDuration, MAX_REPLAY_DURATION),
      stickySession,
      useCompression,
      workerUrl,
      blockAllMedia,
      maskAllInputs,
      maskAllText,
      mutationBreadcrumbLimit,
      mutationLimit,
      slowClickTimeout,
      slowClickIgnoreSelectors,
      networkDetailAllowUrls,
      networkDetailDenyUrls,
      networkCaptureBodies,
      networkRequestHeaders: _getMergedNetworkHeaders(networkRequestHeaders),
      networkResponseHeaders: _getMergedNetworkHeaders(networkResponseHeaders),
      beforeAddRecordingEvent,
      beforeErrorSampling,
      onError,
      attachRawBodyFromRequest,
      _experiments
    };
    if (this._initialOptions.blockAllMedia) {
      this._recordingOptions.blockSelector = !this._recordingOptions.blockSelector ? MEDIA_SELECTORS : `${this._recordingOptions.blockSelector},${MEDIA_SELECTORS}`;
      this._recordingOptions.ignoreCSSAttributes = /* @__PURE__ */ new Set(["background-image"]);
    }
    if (this._isInitialized && isBrowser()) {
      throw new Error("Multiple Sentry Session Replay instances are not supported");
    }
    this._isInitialized = true;
  }
  /** If replay has already been initialized */
  get _isInitialized() {
    return _initialized;
  }
  /** Update _isInitialized */
  set _isInitialized(value) {
    _initialized = value;
  }
  /**
   * Setup and initialize replay container
   */
  afterAllSetup(client) {
    if (!isBrowser() || this._replay) {
      return;
    }
    if (this._initialOptions.attachRawBodyFromRequest) {
      _INTERNAL_instrumentRequestInterface();
    }
    this._setup(client);
    this._initialize(client);
  }
  /**
   * Start a replay regardless of sampling rate. Calling this will always
   * create a new session. Will log a message if replay is already in progress.
   *
   * Creates or loads a session, attaches listeners to varying events (DOM,
   * PerformanceObserver, Recording, Sentry SDK, etc)
   */
  start() {
    if (!this._replay) {
      return;
    }
    this._replay.start();
  }
  /**
   * Start replay buffering. Buffers until `flush()` is called or, if
   * `replaysOnErrorSampleRate` > 0, until an error occurs.
   */
  startBuffering() {
    if (!this._replay) {
      return;
    }
    this._replay.startBuffering();
  }
  /**
   * Currently, this needs to be manually called (e.g. for tests). Sentry SDK
   * does not support a teardown
   */
  stop() {
    if (!this._replay) {
      return Promise.resolve();
    }
    return this._replay.stop({ forceFlush: this._replay.recordingMode === "session", reason: "manual" });
  }
  /**
   * If not in "session" recording mode, flush event buffer which will create a new replay.
   * If replay is not enabled, a new session replay is started.
   * Unless `continueRecording` is false, the replay will continue to record and
   * behave as a "session"-based replay.
   *
   * Otherwise, queue up a flush.
   */
  flush(options) {
    if (!this._replay) {
      return Promise.resolve();
    }
    if (!this._replay.isEnabled()) {
      this._replay.start();
      return Promise.resolve();
    }
    return this._replay.sendBufferedReplayOrFlush(options);
  }
  /**
   * Get the current session ID.
   *
   * @param onlyIfSampled - If true, will only return the session ID if the session is sampled.
   *
   */
  getReplayId(onlyIfSampled) {
    if (!this._replay?.isEnabled()) {
      return;
    }
    return this._replay.getSessionId(onlyIfSampled);
  }
  /**
   * Get the current recording mode. This can be either `session` or `buffer`.
   *
   * `session`: Recording the whole session, sending it continuously
   * `buffer`: Always keeping the last 60s of recording, requires:
   *   - having replaysOnErrorSampleRate > 0 to capture replay when an error occurs
   *   - or calling `flush()` to send the replay
   */
  getRecordingMode() {
    if (!this._replay?.isEnabled()) {
      return;
    }
    return this._replay.recordingMode;
  }
  processSpan(span) {
    const replayId = this.getReplayId(true);
    if (replayId) {
      safeSetSpanJSONAttributes(span, { "sentry.replay_id": replayId });
    }
  }
  /**
   * Initializes replay.
   */
  _initialize(client) {
    if (!this._replay) {
      return;
    }
    this._maybeLoadFromReplayCanvasIntegration(client);
    this._replay.initializeSampling();
  }
  /** Setup the integration. */
  _setup(client) {
    const finalOptions = loadReplayOptionsFromClient(this._initialOptions, client);
    this._replay = new ReplayContainer({
      options: finalOptions,
      recordingOptions: this._recordingOptions
    });
  }
  /** Get canvas options from ReplayCanvas integration, if it is also added. */
  _maybeLoadFromReplayCanvasIntegration(client) {
    try {
      const canvasIntegration = client.getIntegrationByName("ReplayCanvas");
      if (!canvasIntegration) {
        return;
      }
      this._replay["_canvas"] = canvasIntegration.getOptions();
    } catch {
    }
  }
}
function loadReplayOptionsFromClient(initialOptions, client) {
  const opt = client.getOptions();
  const finalOptions = {
    sessionSampleRate: 0,
    errorSampleRate: 0,
    ...initialOptions
  };
  const replaysSessionSampleRate = parseSampleRate(opt.replaysSessionSampleRate);
  const replaysOnErrorSampleRate = parseSampleRate(opt.replaysOnErrorSampleRate);
  if (replaysSessionSampleRate == null && replaysOnErrorSampleRate == null) {
    consoleSandbox(() => {
      console.warn(
        "Replay is disabled because neither `replaysSessionSampleRate` nor `replaysOnErrorSampleRate` are set."
      );
    });
  }
  if (replaysSessionSampleRate != null) {
    finalOptions.sessionSampleRate = replaysSessionSampleRate;
  }
  if (replaysOnErrorSampleRate != null) {
    finalOptions.errorSampleRate = replaysOnErrorSampleRate;
  }
  return finalOptions;
}
function _getMergedNetworkHeaders(headers) {
  return [...DEFAULT_NETWORK_HEADERS, ...headers.map((header) => header.toLowerCase())];
}
function getReplay() {
  const client = getClient();
  return client?.getIntegrationByName("Replay");
}
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
class Mirror2 {
  constructor() {
    __publicField(this, "idNodeMap", /* @__PURE__ */ new Map());
    __publicField(this, "nodeMetaMap", /* @__PURE__ */ new WeakMap());
  }
  getId(n2) {
    if (!n2) return -1;
    const id = this.getMeta(n2)?.id;
    return id ?? -1;
  }
  getNode(id) {
    return this.idNodeMap.get(id) || null;
  }
  getIds() {
    return Array.from(this.idNodeMap.keys());
  }
  getMeta(n2) {
    return this.nodeMetaMap.get(n2) || null;
  }
  // removes the node from idNodeMap
  // doesn't remove the node from nodeMetaMap
  removeNodeFromMap(n2) {
    const id = this.getId(n2);
    this.idNodeMap.delete(id);
    if (n2.childNodes) {
      n2.childNodes.forEach(
        (childNode) => this.removeNodeFromMap(childNode)
      );
    }
  }
  has(id) {
    return this.idNodeMap.has(id);
  }
  hasNode(node) {
    return this.nodeMetaMap.has(node);
  }
  add(n2, meta) {
    const id = meta.id;
    this.idNodeMap.set(id, n2);
    this.nodeMetaMap.set(n2, meta);
  }
  replace(id, n2) {
    const oldNode = this.getNode(id);
    if (oldNode) {
      const meta = this.nodeMetaMap.get(oldNode);
      if (meta) this.nodeMetaMap.set(n2, meta);
    }
    this.idNodeMap.set(id, n2);
  }
  reset() {
    this.idNodeMap = /* @__PURE__ */ new Map();
    this.nodeMetaMap = /* @__PURE__ */ new WeakMap();
  }
}
function createMirror() {
  return new Mirror2();
}
function elementClassMatchesRegex(el, regex) {
  for (let eIndex = el.classList.length; eIndex--; ) {
    const className = el.classList[eIndex];
    if (regex.test(className)) {
      return true;
    }
  }
  return false;
}
function distanceToMatch(node, matchPredicate, limit = Infinity, distance = 0) {
  if (!node) return -1;
  if (node.nodeType !== node.ELEMENT_NODE) return -1;
  if (distance > limit) return -1;
  if (matchPredicate(node)) return distance;
  return distanceToMatch(node.parentNode, matchPredicate, limit, distance + 1);
}
function createMatchPredicate(className, selector) {
  return (node) => {
    const el = node;
    if (el === null) return false;
    try {
      if (className) {
        if (typeof className === "string") {
          if (el.matches(`.${className}`)) return true;
        } else if (elementClassMatchesRegex(el, className)) {
          return true;
        }
      }
      if (selector && el.matches(selector)) return true;
      return false;
    } catch {
      return false;
    }
  };
}
const DEPARTED_MIRROR_ACCESS_WARNING = "Please stop import mirror directly. Instead of that,\r\nnow you can use replayer.getMirror() to access the mirror instance of a replayer,\r\nor you can use record.mirror to access the mirror instance during recording.";
let _mirror = {
  map: {},
  getId() {
    console.error(DEPARTED_MIRROR_ACCESS_WARNING);
    return -1;
  },
  getNode() {
    console.error(DEPARTED_MIRROR_ACCESS_WARNING);
    return null;
  },
  removeNodeFromMap() {
    console.error(DEPARTED_MIRROR_ACCESS_WARNING);
  },
  has() {
    console.error(DEPARTED_MIRROR_ACCESS_WARNING);
    return false;
  },
  reset() {
    console.error(DEPARTED_MIRROR_ACCESS_WARNING);
  }
};
if (typeof window !== "undefined" && window.Proxy && window.Reflect) {
  _mirror = new Proxy(_mirror, {
    get(target, prop, receiver) {
      if (prop === "map") {
        console.error(DEPARTED_MIRROR_ACCESS_WARNING);
      }
      return Reflect.get(target, prop, receiver);
    }
  });
}
function hookSetter(target, key, d2, isRevoked, win = window) {
  const original = win.Object.getOwnPropertyDescriptor(target, key);
  win.Object.defineProperty(
    target,
    key,
    isRevoked ? d2 : {
      set(value) {
        setTimeout$1(() => {
          d2.set.call(this, value);
        }, 0);
        if (original && original.set) {
          original.set.call(this, value);
        }
      }
    }
  );
  return () => hookSetter(target, key, original || {}, true);
}
function patch(source, name, replacement) {
  try {
    if (!(name in source)) {
      return () => {
      };
    }
    const original = source[name];
    const wrapped = replacement(original);
    if (typeof wrapped === "function") {
      wrapped.prototype = wrapped.prototype || {};
      Object.defineProperties(wrapped, {
        __rrweb_original__: {
          enumerable: false,
          value: original
        }
      });
    }
    source[name] = wrapped;
    return () => {
      source[name] = original;
    };
  } catch {
    return () => {
    };
  }
}
if (!/* @__PURE__ */ /[1-9][0-9]{12}/.test(Date.now().toString())) ;
function closestElementOfNode(node) {
  if (!node) {
    return null;
  }
  try {
    const el = node.nodeType === node.ELEMENT_NODE ? node : node.parentElement;
    return el;
  } catch (error2) {
    return null;
  }
}
function isBlocked(node, blockClass, blockSelector, unblockSelector, checkAncestors) {
  if (!node) {
    return false;
  }
  const el = closestElementOfNode(node);
  if (!el) {
    return false;
  }
  const blockedPredicate = createMatchPredicate(blockClass, blockSelector);
  const blockDistance = distanceToMatch(el, blockedPredicate);
  let unblockDistance = -1;
  if (blockDistance < 0) {
    return false;
  }
  if (unblockSelector) {
    unblockDistance = distanceToMatch(
      el,
      createMatchPredicate(null, unblockSelector)
    );
  }
  if (blockDistance > -1 && unblockDistance < 0) {
    return true;
  }
  return blockDistance < unblockDistance;
}
const cachedImplementations = {};
function getImplementation(name) {
  const cached = cachedImplementations[name];
  if (cached) {
    return cached;
  }
  const document2 = window.document;
  let impl = window[name];
  if (document2 && typeof document2.createElement === "function") {
    try {
      const sandbox = document2.createElement("iframe");
      sandbox.hidden = true;
      document2.head.appendChild(sandbox);
      const contentWindow = sandbox.contentWindow;
      if (contentWindow && contentWindow[name]) {
        impl = // eslint-disable-next-line @typescript-eslint/unbound-method
        contentWindow[name];
      }
      document2.head.removeChild(sandbox);
    } catch (e2) {
    }
  }
  return cachedImplementations[name] = impl.bind(
    window
  );
}
function onRequestAnimationFrame(...rest) {
  return getImplementation("requestAnimationFrame")(...rest);
}
function setTimeout$1(...rest) {
  return getImplementation("setTimeout")(...rest);
}
var CanvasContext = /* @__PURE__ */ ((CanvasContext2) => {
  CanvasContext2[CanvasContext2["2D"] = 0] = "2D";
  CanvasContext2[CanvasContext2["WebGL"] = 1] = "WebGL";
  CanvasContext2[CanvasContext2["WebGL2"] = 2] = "WebGL2";
  return CanvasContext2;
})(CanvasContext || {});
let errorHandler;
function registerErrorHandler(handler) {
  errorHandler = handler;
}
const callbackWrapper = (cb) => {
  if (!errorHandler) {
    return cb;
  }
  const rrwebWrapped = ((...rest) => {
    try {
      return cb(...rest);
    } catch (error2) {
      if (errorHandler && errorHandler(error2) === true) {
        return () => {
        };
      }
      throw error2;
    }
  });
  return rrwebWrapped;
};
var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var lookup = typeof Uint8Array === "undefined" ? [] : new Uint8Array(256);
for (var i = 0; i < chars.length; i++) {
  lookup[chars.charCodeAt(i)] = i;
}
var encode = function(arraybuffer) {
  var bytes = new Uint8Array(arraybuffer), i, len = bytes.length, base64 = "";
  for (i = 0; i < len; i += 3) {
    base64 += chars[bytes[i] >> 2];
    base64 += chars[(bytes[i] & 3) << 4 | bytes[i + 1] >> 4];
    base64 += chars[(bytes[i + 1] & 15) << 2 | bytes[i + 2] >> 6];
    base64 += chars[bytes[i + 2] & 63];
  }
  if (len % 3 === 2) {
    base64 = base64.substring(0, base64.length - 1) + "=";
  } else if (len % 3 === 1) {
    base64 = base64.substring(0, base64.length - 2) + "==";
  }
  return base64;
};
const canvasVarMap = /* @__PURE__ */ new Map();
function variableListFor(ctx, ctor) {
  let contextMap = canvasVarMap.get(ctx);
  if (!contextMap) {
    contextMap = /* @__PURE__ */ new Map();
    canvasVarMap.set(ctx, contextMap);
  }
  if (!contextMap.has(ctor)) {
    contextMap.set(ctor, []);
  }
  return contextMap.get(ctor);
}
const saveWebGLVar = (value, win, ctx) => {
  if (!value || !(isInstanceOfWebGLObject(value, win) || typeof value === "object"))
    return;
  const name = value.constructor.name;
  const list = variableListFor(ctx, name);
  let index = list.indexOf(value);
  if (index === -1) {
    index = list.length;
    list.push(value);
  }
  return index;
};
function serializeArg(value, win, ctx) {
  if (value instanceof Array) {
    return value.map((arg) => serializeArg(arg, win, ctx));
  } else if (value === null) {
    return value;
  } else if (value instanceof Float32Array || value instanceof Float64Array || value instanceof Int32Array || value instanceof Uint32Array || value instanceof Uint8Array || value instanceof Uint16Array || value instanceof Int16Array || value instanceof Int8Array || value instanceof Uint8ClampedArray) {
    const name = value.constructor.name;
    return {
      rr_type: name,
      args: [Object.values(value)]
    };
  } else if (
    // SharedArrayBuffer disabled on most browsers due to spectre.
    // More info: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer/SharedArrayBuffer
    // value instanceof SharedArrayBuffer ||
    value instanceof ArrayBuffer
  ) {
    const name = value.constructor.name;
    const base64 = encode(value);
    return {
      rr_type: name,
      base64
    };
  } else if (value instanceof DataView) {
    const name = value.constructor.name;
    return {
      rr_type: name,
      args: [
        serializeArg(value.buffer, win, ctx),
        value.byteOffset,
        value.byteLength
      ]
    };
  } else if (value instanceof HTMLImageElement) {
    const name = value.constructor.name;
    const { src } = value;
    return {
      rr_type: name,
      src
    };
  } else if (value instanceof HTMLCanvasElement) {
    const name = "HTMLImageElement";
    const src = value.toDataURL();
    return {
      rr_type: name,
      src
    };
  } else if (value instanceof ImageData) {
    const name = value.constructor.name;
    return {
      rr_type: name,
      args: [serializeArg(value.data, win, ctx), value.width, value.height]
    };
  } else if (isInstanceOfWebGLObject(value, win) || typeof value === "object") {
    const name = value.constructor.name;
    const index = saveWebGLVar(value, win, ctx);
    return {
      rr_type: name,
      index
    };
  }
  return value;
}
const serializeArgs = (args, win, ctx) => {
  return args.map((arg) => serializeArg(arg, win, ctx));
};
const isInstanceOfWebGLObject = (value, win) => {
  const webGLConstructorNames = [
    "WebGLActiveInfo",
    "WebGLBuffer",
    "WebGLFramebuffer",
    "WebGLProgram",
    "WebGLRenderbuffer",
    "WebGLShader",
    "WebGLShaderPrecisionFormat",
    "WebGLTexture",
    "WebGLUniformLocation",
    "WebGLVertexArrayObject",
    // In old Chrome versions, value won't be an instanceof WebGLVertexArrayObject.
    "WebGLVertexArrayObjectOES"
  ];
  const supportedWebGLConstructorNames = webGLConstructorNames.filter(
    (name) => typeof win[name] === "function"
  );
  return Boolean(
    supportedWebGLConstructorNames.find(
      (name) => value instanceof win[name]
    )
  );
};
function initCanvas2DMutationObserver(cb, win, blockClass2, blockSelector, unblockSelector) {
  const handlers2 = [];
  const props2D = Object.getOwnPropertyNames(
    win.CanvasRenderingContext2D.prototype
  );
  for (const prop of props2D) {
    try {
      if (typeof win.CanvasRenderingContext2D.prototype[prop] !== "function") {
        continue;
      }
      const restoreHandler = patch(
        win.CanvasRenderingContext2D.prototype,
        prop,
        function(original) {
          return function(...args) {
            if (!isBlocked(
              this.canvas,
              blockClass2,
              blockSelector,
              unblockSelector,
              true
            )) {
              setTimeout$1(() => {
                const recordArgs = serializeArgs(args, win, this);
                cb(this.canvas, {
                  type: CanvasContext["2D"],
                  property: prop,
                  args: recordArgs
                });
              }, 0);
            }
            return original.apply(this, args);
          };
        }
      );
      handlers2.push(restoreHandler);
    } catch {
      const hookHandler = hookSetter(
        win.CanvasRenderingContext2D.prototype,
        prop,
        {
          set(v2) {
            cb(this.canvas, {
              type: CanvasContext["2D"],
              property: prop,
              args: [v2],
              setter: true
            });
          }
        }
      );
      handlers2.push(hookHandler);
    }
  }
  return () => {
    handlers2.forEach((h2) => h2());
  };
}
function getNormalizedContextName(contextType) {
  return contextType === "experimental-webgl" ? "webgl" : contextType;
}
function initCanvasContextObserver(win, blockClass, blockSelector, unblockSelector, setPreserveDrawingBufferToTrue) {
  const handlers2 = [];
  try {
    const restoreHandler = patch(
      win.HTMLCanvasElement.prototype,
      "getContext",
      function(original) {
        return function(contextType, ...args) {
          if (!isBlocked(this, blockClass, blockSelector, unblockSelector, true)) {
            const ctxName = getNormalizedContextName(contextType);
            if (!("__context" in this)) this.__context = ctxName;
            if (setPreserveDrawingBufferToTrue && ["webgl", "webgl2"].includes(ctxName)) {
              if (args[0] && typeof args[0] === "object") {
                const contextAttributes = args[0];
                if (!contextAttributes.preserveDrawingBuffer) {
                  contextAttributes.preserveDrawingBuffer = true;
                }
              } else {
                args.splice(0, 1, {
                  preserveDrawingBuffer: true
                });
              }
            }
          }
          return original.apply(this, [contextType, ...args]);
        };
      }
    );
    handlers2.push(restoreHandler);
  } catch {
    console.error("failed to patch HTMLCanvasElement.prototype.getContext");
  }
  return () => {
    handlers2.forEach((h2) => h2());
  };
}
function patchGLPrototype(prototype, type, cb, blockClass2, blockSelector, unblockSelector, _mirror2, win) {
  const handlers2 = [];
  const props = Object.getOwnPropertyNames(prototype);
  for (const prop of props) {
    if (
      //prop.startsWith('get') ||  // e.g. getProgramParameter, but too risky
      [
        "isContextLost",
        "canvas",
        "drawingBufferWidth",
        "drawingBufferHeight"
      ].includes(prop)
    ) {
      continue;
    }
    try {
      if (typeof prototype[prop] !== "function") {
        continue;
      }
      const restoreHandler = patch(
        prototype,
        prop,
        function(original) {
          return function(...args) {
            const result = original.apply(this, args);
            saveWebGLVar(result, win, this);
            if ("tagName" in this.canvas && !isBlocked(
              this.canvas,
              blockClass2,
              blockSelector,
              unblockSelector,
              true
            )) {
              const recordArgs = serializeArgs(args, win, this);
              const mutation = {
                type,
                property: prop,
                args: recordArgs
              };
              cb(this.canvas, mutation);
            }
            return result;
          };
        }
      );
      handlers2.push(restoreHandler);
    } catch {
      const hookHandler = hookSetter(prototype, prop, {
        set(v2) {
          cb(this.canvas, {
            type,
            property: prop,
            args: [v2],
            setter: true
          });
        }
      });
      handlers2.push(hookHandler);
    }
  }
  return handlers2;
}
function initCanvasWebGLMutationObserver(cb, win, blockClass2, blockSelector, unblockSelector, mirror2) {
  const handlers2 = [];
  handlers2.push(
    ...patchGLPrototype(
      win.WebGLRenderingContext.prototype,
      CanvasContext.WebGL,
      cb,
      blockClass2,
      blockSelector,
      unblockSelector,
      mirror2,
      win
    )
  );
  if (typeof win.WebGL2RenderingContext !== "undefined") {
    handlers2.push(
      ...patchGLPrototype(
        win.WebGL2RenderingContext.prototype,
        CanvasContext.WebGL2,
        cb,
        blockClass2,
        blockSelector,
        unblockSelector,
        mirror2,
        win
      )
    );
  }
  return () => {
    handlers2.forEach((h2) => h2());
  };
}
const r = `for(var e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",t="undefined"==typeof Uint8Array?[]:new Uint8Array(256),a=0;a<64;a++)t[e.charCodeAt(a)]=a;var n=function(t){var a,n=new Uint8Array(t),r=n.length,s="";for(a=0;a<r;a+=3)s+=e[n[a]>>2],s+=e[(3&n[a])<<4|n[a+1]>>4],s+=e[(15&n[a+1])<<2|n[a+2]>>6],s+=e[63&n[a+2]];return r%3==2?s=s.substring(0,s.length-1)+"=":r%3==1&&(s=s.substring(0,s.length-2)+"=="),s};const r=new Map,s=new Map;const i=self;i.onmessage=async function(e){if(!("OffscreenCanvas"in globalThis))return i.postMessage({id:e.data.id});{const{id:t,bitmap:a,width:o,height:f,maxCanvasSize:c,dataURLOptions:g}=e.data,u=async function(e,t,a){const r=e+"-"+t;if("OffscreenCanvas"in globalThis){if(s.has(r))return s.get(r);const i=new OffscreenCanvas(e,t);i.getContext("2d");const o=await i.convertToBlob(a),f=await o.arrayBuffer(),c=n(f);return s.set(r,c),c}return""}(o,f,g),[h,d]=function(e,t,a){if(!a)return[e,t];const[n,r]=a;if(e<=n&&t<=r)return[e,t];let s=e,i=t;return s>n&&(i=Math.floor(n*t/e),s=n),i>r&&(s=Math.floor(r*e/t),i=r),[s,i]}(o,f,c),l=new OffscreenCanvas(h,d),w=l.getContext("bitmaprenderer"),p=h===o&&d===f?a:await createImageBitmap(a,{resizeWidth:h,resizeHeight:d,resizeQuality:"low"});w?.transferFromImageBitmap(p),a.close();const y=await l.convertToBlob(g),v=y.type,b=await y.arrayBuffer(),m=n(b);if(p.close(),!r.has(t)&&await u===m)return r.set(t,m),i.postMessage({id:t});if(r.get(t)===m)return i.postMessage({id:t});i.postMessage({id:t,type:v,base64:m,width:o,height:f}),r.set(t,m)}};`;
function t() {
  const t2 = new Blob([r]);
  return URL.createObjectURL(t2);
}
class CanvasManager {
  constructor(options) {
    this.pendingCanvasMutations = /* @__PURE__ */ new Map();
    this.rafStamps = { latestId: 0, invokeId: null };
    this.shadowDoms = /* @__PURE__ */ new Set();
    this.windowsSet = /* @__PURE__ */ new WeakSet();
    this.windows = [];
    this.restoreHandlers = [];
    this.frozen = false;
    this.locked = false;
    this.snapshotInProgressMap = /* @__PURE__ */ new Map();
    this.worker = null;
    this.lastSnapshotTime = 0;
    this.processMutation = (target, mutation) => {
      const newFrame = this.rafStamps.invokeId && this.rafStamps.latestId !== this.rafStamps.invokeId;
      if (newFrame || !this.rafStamps.invokeId)
        this.rafStamps.invokeId = this.rafStamps.latestId;
      if (!this.pendingCanvasMutations.has(target)) {
        this.pendingCanvasMutations.set(target, []);
      }
      this.pendingCanvasMutations.get(target).push(mutation);
    };
    const {
      enableManualSnapshot,
      sampling = "all",
      win,
      recordCanvas,
      errorHandler: errorHandler2
    } = options;
    options.sampling = sampling;
    this.mutationCb = options.mutationCb;
    this.mirror = options.mirror;
    this.options = options;
    if (errorHandler2) {
      registerErrorHandler(errorHandler2);
    }
    if (recordCanvas && typeof sampling === "number" || enableManualSnapshot) {
      this.worker = this.initFPSWorker();
    }
    this.addWindow(win);
    if (enableManualSnapshot) {
      return;
    }
    callbackWrapper(() => {
      if (recordCanvas && sampling === "all") {
        this.startRAFTimestamping();
        this.startPendingCanvasMutationFlusher();
      }
      if (recordCanvas && typeof sampling === "number") {
        this.initCanvasFPSObserver();
      }
    })();
  }
  reset() {
    this.pendingCanvasMutations.clear();
    this.restoreHandlers.forEach((handler) => {
      try {
        handler();
      } catch (e2) {
      }
    });
    this.restoreHandlers = [];
    this.windowsSet = /* @__PURE__ */ new WeakSet();
    this.windows = [];
    this.shadowDoms = /* @__PURE__ */ new Set();
    this.worker?.terminate();
    this.worker = null;
    this.snapshotInProgressMap = /* @__PURE__ */ new Map();
  }
  freeze() {
    this.frozen = true;
  }
  unfreeze() {
    this.frozen = false;
  }
  lock() {
    this.locked = true;
  }
  unlock() {
    this.locked = false;
  }
  addWindow(win) {
    const {
      sampling = "all",
      blockClass,
      blockSelector,
      unblockSelector,
      recordCanvas,
      enableManualSnapshot
    } = this.options;
    if (this.windowsSet.has(win)) return;
    if (enableManualSnapshot) {
      this.windowsSet.add(win);
      this.windows.push(new WeakRef(win));
      return;
    }
    callbackWrapper(() => {
      if (recordCanvas && sampling === "all") {
        this.initCanvasMutationObserver(
          win,
          blockClass,
          blockSelector,
          unblockSelector
        );
      }
      if (recordCanvas && typeof sampling === "number") {
        const canvasContextReset = initCanvasContextObserver(
          win,
          blockClass,
          blockSelector,
          unblockSelector,
          true
        );
        this.restoreHandlers.push(() => {
          canvasContextReset();
        });
      }
    })();
    this.windowsSet.add(win);
    this.windows.push(new WeakRef(win));
  }
  addShadowRoot(shadowRoot) {
    this.shadowDoms.add(new WeakRef(shadowRoot));
  }
  resetShadowRoots() {
    this.shadowDoms = /* @__PURE__ */ new Set();
  }
  snapshot(canvasElement, options) {
    if (options?.skipRequestAnimationFrame) {
      this.takeSnapshot(performance.now(), true, canvasElement);
      return;
    }
    onRequestAnimationFrame(
      (timestamp) => this.takeSnapshot(timestamp, true, canvasElement)
    );
  }
  initFPSWorker() {
    const worker = new Worker(t());
    worker.onmessage = (e2) => {
      const data = e2.data;
      const { id } = data;
      this.snapshotInProgressMap.set(id, false);
      if (!("base64" in data)) return;
      const { base64, type, width, height } = data;
      this.mutationCb({
        id,
        type: CanvasContext["2D"],
        commands: [
          {
            property: "clearRect",
            // wipe canvas
            args: [0, 0, width, height]
          },
          {
            property: "drawImage",
            // draws (semi-transparent) image
            args: [
              {
                rr_type: "ImageBitmap",
                args: [
                  {
                    rr_type: "Blob",
                    data: [{ rr_type: "ArrayBuffer", base64 }],
                    type
                  }
                ]
              },
              0,
              0,
              // The below args are needed if we enforce a max size, we want to
              // retain the original size when drawing the image (which should be smaller)
              width,
              height
            ]
          }
        ]
      });
    };
    return worker;
  }
  initCanvasFPSObserver() {
    let rafId;
    if (!this.windows.length && !this.shadowDoms.size) {
      return;
    }
    const rafCallback = (timestamp) => {
      this.takeSnapshot(timestamp, false);
      rafId = onRequestAnimationFrame(rafCallback);
    };
    rafId = onRequestAnimationFrame(rafCallback);
    this.restoreHandlers.push(() => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    });
  }
  initCanvasMutationObserver(win, blockClass, blockSelector, unblockSelector) {
    const canvasContextReset = initCanvasContextObserver(
      win,
      blockClass,
      blockSelector,
      unblockSelector,
      false
    );
    const canvas2DReset = initCanvas2DMutationObserver(
      this.processMutation.bind(this),
      win,
      blockClass,
      blockSelector,
      unblockSelector
    );
    const canvasWebGL1and2Reset = initCanvasWebGLMutationObserver(
      this.processMutation.bind(this),
      win,
      blockClass,
      blockSelector,
      unblockSelector,
      this.mirror
    );
    this.restoreHandlers.push(() => {
      canvasContextReset();
      canvas2DReset();
      canvasWebGL1and2Reset();
    });
  }
  /**
   * Returns all `canvas` elements that are not blocked by the given selectors. Searches all windows and shadow roots.
   */
  getCanvasElements(blockClass, blockSelector, unblockSelector) {
    const matchedCanvas = [];
    const searchCanvas = (root) => {
      root.querySelectorAll("canvas").forEach((canvas) => {
        if (!isBlocked(canvas, blockClass, blockSelector, unblockSelector)) {
          matchedCanvas.push(canvas);
        }
      });
    };
    for (const item of this.windows) {
      const window2 = item.deref();
      let _document;
      try {
        _document = window2 && window2.document;
      } catch {
      }
      if (_document) {
        searchCanvas(_document);
      }
    }
    for (const item of this.shadowDoms) {
      const shadowRoot = item.deref();
      if (shadowRoot) {
        searchCanvas(shadowRoot);
      }
    }
    return matchedCanvas;
  }
  /**
   * Takes a snapshot of the provided canvas element, or will search all windows/shadow roots for canvases. Will self-throttle based on `options.sampling`.
   *
   * @returns `true` if the snapshot was taken, `false` if it was throttled.
   */
  takeSnapshot(timestamp, isManualSnapshot, canvasElement) {
    const {
      sampling,
      blockClass,
      blockSelector,
      unblockSelector,
      dataURLOptions,
      maxCanvasSize
    } = this.options;
    const fps = sampling === "all" ? 2 : sampling || 2;
    const timeBetweenSnapshots = 1e3 / fps;
    const shouldThrottle = this.lastSnapshotTime && timestamp - this.lastSnapshotTime < timeBetweenSnapshots;
    if (shouldThrottle) {
      return false;
    }
    this.lastSnapshotTime = timestamp;
    const canvases = canvasElement ? [canvasElement] : this.getCanvasElements(blockClass, blockSelector, unblockSelector);
    canvases.forEach((canvas) => {
      const id = this.mirror.getId(canvas);
      if (!this.mirror.hasNode(canvas) || !canvas.width || !canvas.height || this.snapshotInProgressMap.get(id)) {
        return;
      }
      this.snapshotInProgressMap.set(id, true);
      if (!isManualSnapshot && ["webgl", "webgl2"].includes(canvas.__context)) {
        const context = canvas.getContext(canvas.__context);
        if (context?.getContextAttributes()?.preserveDrawingBuffer === false) {
          context.clear(context.COLOR_BUFFER_BIT);
        }
      }
      createImageBitmap(canvas).then((bitmap) => {
        this.worker?.postMessage(
          {
            id,
            bitmap,
            width: canvas.width,
            height: canvas.height,
            dataURLOptions,
            maxCanvasSize
          },
          [bitmap]
        );
      }).catch((error2) => {
        callbackWrapper(() => {
          this.snapshotInProgressMap.delete(id);
          throw error2;
        })();
      });
    });
    return true;
  }
  startPendingCanvasMutationFlusher() {
    onRequestAnimationFrame(() => this.flushPendingCanvasMutations());
  }
  startRAFTimestamping() {
    const setLatestRAFTimestamp = (timestamp) => {
      this.rafStamps.latestId = timestamp;
      onRequestAnimationFrame(setLatestRAFTimestamp);
    };
    onRequestAnimationFrame(setLatestRAFTimestamp);
  }
  flushPendingCanvasMutations() {
    this.pendingCanvasMutations.forEach(
      (_values, canvas) => {
        const id = this.mirror.getId(canvas);
        this.flushPendingCanvasMutationFor(canvas, id);
      }
    );
    onRequestAnimationFrame(() => this.flushPendingCanvasMutations());
  }
  flushPendingCanvasMutationFor(canvas, id) {
    if (this.frozen || this.locked) {
      return;
    }
    const valuesWithType = this.pendingCanvasMutations.get(canvas);
    if (!valuesWithType || id === -1) return;
    const values = valuesWithType.map((value) => {
      const { type: type2, ...rest } = value;
      return rest;
    });
    const { type } = valuesWithType[0];
    this.mutationCb({ id, type, commands: values });
    this.pendingCanvasMutations.delete(canvas);
  }
}
try {
  if (Array.from([1], (x2) => x2 * 2)[0] !== 2) {
    const cleanFrame = document.createElement("iframe");
    document.body.appendChild(cleanFrame);
    Array.from = cleanFrame.contentWindow?.Array.from || Array.from;
    document.body.removeChild(cleanFrame);
  }
} catch (err) {
  console.debug("Unable to override Array.from", err);
}
createMirror();
var n;
!(function(t2) {
  t2[t2.NotStarted = 0] = "NotStarted", t2[t2.Running = 1] = "Running", t2[t2.Stopped = 2] = "Stopped";
})(n || (n = {}));
const CANVAS_QUALITY = {
  low: {
    sampling: {
      canvas: 1
    },
    dataURLOptions: {
      type: "image/webp",
      quality: 0.25
    }
  },
  medium: {
    sampling: {
      canvas: 2
    },
    dataURLOptions: {
      type: "image/webp",
      quality: 0.4
    }
  },
  high: {
    sampling: {
      canvas: 4
    },
    dataURLOptions: {
      type: "image/webp",
      quality: 0.5
    }
  }
};
const INTEGRATION_NAME$3 = "ReplayCanvas";
const DEFAULT_MAX_CANVAS_SIZE = 1280;
const _replayCanvasIntegration = ((options = {}) => {
  const [maxCanvasWidth, maxCanvasHeight] = options.maxCanvasSize || [];
  const _canvasOptions = {
    quality: options.quality || "medium",
    enableManualSnapshot: options.enableManualSnapshot,
    maxCanvasSize: [
      maxCanvasWidth ? Math.min(maxCanvasWidth, DEFAULT_MAX_CANVAS_SIZE) : DEFAULT_MAX_CANVAS_SIZE,
      maxCanvasHeight ? Math.min(maxCanvasHeight, DEFAULT_MAX_CANVAS_SIZE) : DEFAULT_MAX_CANVAS_SIZE
    ]
  };
  let currentCanvasManager;
  let canvasManagerResolve;
  const _canvasManager = new Promise((resolve) => canvasManagerResolve = resolve);
  return {
    name: INTEGRATION_NAME$3,
    getOptions() {
      const { quality, enableManualSnapshot, maxCanvasSize } = _canvasOptions;
      return {
        enableManualSnapshot,
        recordCanvas: true,
        getCanvasManager: (getCanvasManagerOptions) => {
          const manager = new CanvasManager({
            ...getCanvasManagerOptions,
            enableManualSnapshot,
            maxCanvasSize,
            errorHandler: (err) => {
              try {
                if (typeof err === "object") {
                  err.__rrweb__ = true;
                }
              } catch {
              }
            }
          });
          currentCanvasManager = manager;
          canvasManagerResolve(manager);
          return manager;
        },
        ...CANVAS_QUALITY[quality] || CANVAS_QUALITY.medium
      };
    },
    async snapshot(canvasElement, options2) {
      const canvasManager = currentCanvasManager || await _canvasManager;
      canvasManager.snapshot(canvasElement, options2);
    }
  };
});
const replayCanvasIntegration = defineIntegration(
  _replayCanvasIntegration
);
function baggageHeaderHasSentryValues(baggageHeader) {
  return baggageHeader.split(",").some((value) => value.trim().startsWith("sentry-"));
}
function getFullURL(url) {
  try {
    const parsed = new URL(url, WINDOW$4.location.origin);
    return parsed.href;
  } catch {
    return void 0;
  }
}
function isPerformanceResourceTiming(entry) {
  return entry.entryType === "resource" && "initiatorType" in entry && typeof entry.nextHopProtocol === "string" && (entry.initiatorType === "fetch" || entry.initiatorType === "xmlhttprequest");
}
function createHeadersSafely(headers) {
  try {
    return new Headers(headers);
  } catch {
    return void 0;
  }
}
const defaultRequestInstrumentationOptions = {
  traceFetch: true,
  traceXHR: true,
  enableHTTPTimings: true,
  trackFetchStreamPerformance: false
};
function instrumentOutgoingRequests(client, _options) {
  const {
    traceFetch,
    traceXHR,
    shouldCreateSpanForRequest,
    enableHTTPTimings,
    tracePropagationTargets,
    onRequestSpanStart,
    onRequestSpanEnd
  } = {
    ...defaultRequestInstrumentationOptions,
    ..._options
  };
  const shouldCreateSpan = typeof shouldCreateSpanForRequest === "function" ? shouldCreateSpanForRequest : (_2) => true;
  const shouldAttachHeadersWithTargets = (url) => shouldAttachHeaders(url, tracePropagationTargets);
  const spans = {};
  const propagateTraceparent = client.getOptions().propagateTraceparent;
  if (traceFetch) {
    addFetchInstrumentationHandler((handlerData) => {
      const createdSpan = instrumentFetchRequest(handlerData, shouldCreateSpan, shouldAttachHeadersWithTargets, spans, {
        propagateTraceparent,
        onRequestSpanEnd
      });
      if (createdSpan) {
        const fullUrl = getFullURL(handlerData.fetchData.url);
        const host = fullUrl ? parseUrl(fullUrl).host : void 0;
        createdSpan.setAttributes({
          "http.url": fullUrl ? stripDataUrlContent(fullUrl) : void 0,
          "server.address": host
        });
        if (enableHTTPTimings) {
          addHTTPTimings(createdSpan, client);
        }
        onRequestSpanStart?.(createdSpan, { headers: handlerData.headers });
      }
    });
  }
  if (traceXHR) {
    addXhrInstrumentationHandler((handlerData) => {
      const createdSpan = xhrCallback(
        handlerData,
        shouldCreateSpan,
        shouldAttachHeadersWithTargets,
        spans,
        propagateTraceparent,
        onRequestSpanEnd
      );
      if (createdSpan) {
        if (enableHTTPTimings) {
          addHTTPTimings(createdSpan, client);
        }
        onRequestSpanStart?.(createdSpan, {
          headers: createHeadersSafely(handlerData.xhr.__sentry_xhr_v3__?.request_headers)
        });
      }
    });
  }
}
const HTTP_TIMING_WAIT_MS = 300;
function addHTTPTimings(span, client) {
  const { url } = spanToJSON(span).data;
  if (!url || typeof url !== "string") {
    return;
  }
  let onEntryFound = () => void setTimeout(unsubscribePerformanceObsever);
  if (hasSpanStreamingEnabled(client)) {
    const originalEnd = span.end.bind(span);
    span.end = (endTimestamp) => {
      const capturedEndTimestamp = endTimestamp ?? timestampInSeconds();
      let isEnded = false;
      const endSpanAndCleanup = () => {
        if (isEnded) {
          return;
        }
        isEnded = true;
        setTimeout(unsubscribePerformanceObsever);
        originalEnd(capturedEndTimestamp);
        clearTimeout(fallbackTimeout);
      };
      onEntryFound = endSpanAndCleanup;
      const fallbackTimeout = setTimeout(endSpanAndCleanup, HTTP_TIMING_WAIT_MS);
    };
  }
  const unsubscribePerformanceObsever = addPerformanceInstrumentationHandler("resource", ({ entries }) => {
    entries.forEach((entry) => {
      if (isPerformanceResourceTiming(entry) && entry.name.endsWith(url)) {
        span.setAttributes(resourceTimingToSpanAttributes(entry));
        onEntryFound();
      }
    });
  });
}
function shouldAttachHeaders(targetUrl, tracePropagationTargets) {
  const href = getLocationHref();
  if (!href) {
    const isRelativeSameOriginRequest = !!targetUrl.match(/^\/(?!\/)/);
    if (!tracePropagationTargets) {
      return isRelativeSameOriginRequest;
    } else {
      return stringMatchesSomePattern(targetUrl, tracePropagationTargets);
    }
  } else {
    let resolvedUrl;
    let currentOrigin;
    try {
      resolvedUrl = new URL(targetUrl, href);
      currentOrigin = new URL(href).origin;
    } catch {
      return false;
    }
    const isSameOriginRequest = resolvedUrl.origin === currentOrigin;
    if (!tracePropagationTargets) {
      return isSameOriginRequest;
    } else {
      return stringMatchesSomePattern(resolvedUrl.toString(), tracePropagationTargets) || isSameOriginRequest && stringMatchesSomePattern(resolvedUrl.pathname, tracePropagationTargets);
    }
  }
}
function xhrCallback(handlerData, shouldCreateSpan, shouldAttachHeaders2, spans, propagateTraceparent, onRequestSpanEnd) {
  const xhr = handlerData.xhr;
  const sentryXhrData = xhr?.[SENTRY_XHR_DATA_KEY];
  if (!xhr || xhr.__sentry_own_request__ || !sentryXhrData) {
    return void 0;
  }
  const { url, method } = sentryXhrData;
  const shouldCreateSpanResult = hasSpansEnabled() && shouldCreateSpan(url);
  if (handlerData.endTimestamp) {
    const spanId = xhr.__sentry_xhr_span_id__;
    if (!spanId) return;
    const span2 = spans[spanId];
    if (span2) {
      if (shouldCreateSpanResult && sentryXhrData.status_code !== void 0) {
        setHttpStatus(span2, sentryXhrData.status_code);
        span2.end();
        onRequestSpanEnd?.(span2, {
          headers: createHeadersSafely(parseXhrResponseHeaders(xhr)),
          error: handlerData.error
        });
      }
      delete spans[spanId];
    }
    return void 0;
  }
  const fullUrl = getFullURL(url);
  const parsedUrl = fullUrl ? parseUrl(fullUrl) : parseUrl(url);
  const urlForSpanName = stripDataUrlContent(stripUrlQueryAndFragment(url));
  const client = getClient();
  const hasParent = !!getActiveSpan();
  const shouldEmitSpan = hasParent || !!client && hasSpanStreamingEnabled(client);
  const span = shouldCreateSpanResult && shouldEmitSpan ? startInactiveSpan({
    name: `${method} ${urlForSpanName}`,
    attributes: {
      url: stripDataUrlContent(url),
      type: "xhr",
      "http.method": method,
      "http.url": fullUrl ? stripDataUrlContent(fullUrl) : void 0,
      "server.address": parsedUrl?.host,
      [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.http.browser",
      [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "http.client",
      ...parsedUrl?.search && { "http.query": parsedUrl?.search },
      ...parsedUrl?.hash && { "http.fragment": parsedUrl?.hash }
    }
  }) : new SentryNonRecordingSpan();
  if (shouldCreateSpanResult && !shouldEmitSpan) {
    client?.recordDroppedEvent("no_parent_span", "span");
  }
  xhr.__sentry_xhr_span_id__ = span.spanContext().spanId;
  spans[xhr.__sentry_xhr_span_id__] = span;
  if (shouldAttachHeaders2(url)) {
    addTracingHeadersToXhrRequest(
      xhr,
      // If performance is disabled (TWP) or there's no active root span (pageload/navigation/interaction),
      // we do not want to use the span as base for the trace headers,
      // which means that the headers will be generated from the scope and the sampling decision is deferred
      hasSpansEnabled() && shouldEmitSpan ? span : void 0,
      propagateTraceparent
    );
  }
  if (client) {
    client.emit("beforeOutgoingRequestSpan", span, handlerData);
  }
  return span;
}
function addTracingHeadersToXhrRequest(xhr, span, propagateTraceparent) {
  const { "sentry-trace": sentryTrace, baggage, traceparent } = getTraceData({ span, propagateTraceparent });
  if (sentryTrace) {
    setHeaderOnXhr(xhr, sentryTrace, baggage, traceparent);
  }
}
function setHeaderOnXhr(xhr, sentryTraceHeader, sentryBaggageHeader, traceparentHeader) {
  const originalHeaders = xhr.__sentry_xhr_v3__?.request_headers;
  if (originalHeaders?.["sentry-trace"] || !xhr.setRequestHeader) {
    return;
  }
  try {
    xhr.setRequestHeader("sentry-trace", sentryTraceHeader);
    if (traceparentHeader && !originalHeaders?.["traceparent"]) {
      xhr.setRequestHeader("traceparent", traceparentHeader);
    }
    if (sentryBaggageHeader) {
      const originalBaggageHeader = originalHeaders?.["baggage"];
      if (!originalBaggageHeader || !baggageHeaderHasSentryValues(originalBaggageHeader)) {
        xhr.setRequestHeader("baggage", sentryBaggageHeader);
      }
    }
  } catch {
  }
}
const responseToStreamSpan = /* @__PURE__ */ new WeakMap();
const responseToFallbackTimeout = /* @__PURE__ */ new WeakMap();
const STREAM_RESOLVE_FALLBACK_MS = 9e4;
const STREAMING_CONTENT_TYPES = ["text/event-stream", "application/x-ndjson", "application/stream+json"];
const fetchStreamPerformanceIntegration = defineIntegration(() => {
  return {
    name: "FetchStreamPerformance",
    setup() {
      addFetchEndInstrumentationHandler((handlerData) => {
        if (handlerData.response) {
          const streamSpan = responseToStreamSpan.get(handlerData.response);
          if (streamSpan && handlerData.endTimestamp) {
            streamSpan.end(handlerData.endTimestamp);
            const fallbackTimeout = responseToFallbackTimeout.get(handlerData.response);
            if (fallbackTimeout) {
              clearTimeout(fallbackTimeout);
            }
          }
        }
      });
      addFetchInstrumentationHandler((handlerData) => {
        if (handlerData.endTimestamp && handlerData.response) {
          const contentType = handlerData.response.headers?.get("content-type") || "";
          if (handlerData.response.headers?.get("content-length") || !STREAMING_CONTENT_TYPES.some((t2) => contentType.startsWith(t2))) {
            return;
          }
          const url = handlerData.fetchData?.url || "";
          const method = handlerData.fetchData?.method || "GET";
          const parsedUrl = parseStringToURLObject(url);
          const sanitizedUrl = url.startsWith("data:") ? stripDataUrlContent(url) : parsedUrl ? getSanitizedUrlStringFromUrlObject(parsedUrl) : url;
          const streamSpan = startInactiveSpan({
            name: `${method} ${sanitizedUrl}`,
            startTime: handlerData.endTimestamp,
            attributes: {
              url: stripDataUrlContent(url),
              "http.method": method,
              type: "fetch",
              [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "http.client.stream",
              [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.http.browser.stream"
            }
          });
          responseToStreamSpan.set(handlerData.response, streamSpan);
          const fallbackTimeout = setTimeout(() => {
            if (streamSpan.isRecording()) {
              streamSpan.end();
            }
          }, STREAM_RESOLVE_FALLBACK_MS);
          responseToFallbackTimeout.set(handlerData.response, fallbackTimeout);
        }
      });
    }
  };
});
function registerBackgroundTabDetection() {
  if (WINDOW$4.document) {
    WINDOW$4.document.addEventListener("visibilitychange", () => {
      const activeSpan = getActiveSpan();
      if (!activeSpan) {
        return;
      }
      const rootSpan = getRootSpan(activeSpan);
      if (WINDOW$4.document.hidden && rootSpan) {
        const cancelledStatus = "cancelled";
        const { op, status } = spanToJSON(rootSpan);
        if (DEBUG_BUILD$2) {
          debug$2.log(`[Tracing] Transaction: ${cancelledStatus} -> since tab moved to the background, op: ${op}`);
        }
        if (!status) {
          rootSpan.setStatus({ code: SPAN_STATUS_ERROR, message: cancelledStatus });
        }
        rootSpan.setAttribute("sentry.cancellation_reason", "document.hidden");
        rootSpan.end();
      }
    });
  } else {
    DEBUG_BUILD$2 && debug$2.warn("[Tracing] Could not set up background tab detection due to lack of global document");
  }
}
const PREVIOUS_TRACE_MAX_DURATION = 3600;
const PREVIOUS_TRACE_KEY = "sentry_previous_trace";
const PREVIOUS_TRACE_TMP_SPAN_ATTRIBUTE = "sentry.previous_trace";
function linkTraces(client, {
  linkPreviousTrace,
  consistentTraceSampling
}) {
  const useSessionStorage = linkPreviousTrace === "session-storage";
  let inMemoryPreviousTraceInfo = useSessionStorage ? getPreviousTraceFromSessionStorage() : void 0;
  client.on("spanStart", (span) => {
    if (getRootSpan(span) !== span) {
      return;
    }
    const oldPropagationContext = getCurrentScope().getPropagationContext();
    inMemoryPreviousTraceInfo = addPreviousTraceSpanLink(inMemoryPreviousTraceInfo, span, oldPropagationContext);
    if (useSessionStorage) {
      storePreviousTraceInSessionStorage(inMemoryPreviousTraceInfo);
    }
  });
  let isFirstTraceOnPageload = true;
  if (consistentTraceSampling) {
    client.on("beforeSampling", (mutableSamplingContextData) => {
      if (!inMemoryPreviousTraceInfo) {
        return;
      }
      const scope = getCurrentScope();
      const currentPropagationContext = scope.getPropagationContext();
      if (isFirstTraceOnPageload && currentPropagationContext.parentSpanId) {
        isFirstTraceOnPageload = false;
        return;
      }
      scope.setPropagationContext({
        ...currentPropagationContext,
        dsc: {
          ...currentPropagationContext.dsc,
          sample_rate: String(inMemoryPreviousTraceInfo.sampleRate),
          sampled: String(spanContextSampled(inMemoryPreviousTraceInfo.spanContext))
        },
        sampleRand: inMemoryPreviousTraceInfo.sampleRand
      });
      mutableSamplingContextData.parentSampled = spanContextSampled(inMemoryPreviousTraceInfo.spanContext);
      mutableSamplingContextData.parentSampleRate = inMemoryPreviousTraceInfo.sampleRate;
      mutableSamplingContextData.spanAttributes = {
        ...mutableSamplingContextData.spanAttributes,
        [SEMANTIC_ATTRIBUTE_SENTRY_PREVIOUS_TRACE_SAMPLE_RATE]: inMemoryPreviousTraceInfo.sampleRate
      };
    });
  }
}
function addPreviousTraceSpanLink(previousTraceInfo, span, oldPropagationContext) {
  const spanJson = spanToJSON(span);
  function getSampleRate() {
    try {
      const oldSampleRate = Number(
        spanJson.data?.[SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE] ?? oldPropagationContext.dsc?.sample_rate
      );
      return Number.isNaN(oldSampleRate) ? 0 : oldSampleRate;
    } catch {
      return 0;
    }
  }
  const updatedPreviousTraceInfo = {
    spanContext: span.spanContext(),
    startTimestamp: spanJson.start_timestamp,
    sampleRate: getSampleRate(),
    sampleRand: oldPropagationContext.sampleRand
  };
  if (!previousTraceInfo) {
    return updatedPreviousTraceInfo;
  }
  const previousTraceSpanCtx = previousTraceInfo.spanContext;
  if (previousTraceSpanCtx.traceId === spanJson.trace_id) {
    return previousTraceInfo;
  }
  if (Date.now() / 1e3 - previousTraceInfo.startTimestamp <= PREVIOUS_TRACE_MAX_DURATION) {
    if (DEBUG_BUILD$2) {
      debug$2.log(
        `Adding previous_trace \`${JSON.stringify(previousTraceSpanCtx)}\` link to span \`${JSON.stringify({
          op: spanJson.op,
          ...span.spanContext()
        })}\``
      );
    }
    span.addLink({
      context: previousTraceSpanCtx,
      attributes: {
        [SEMANTIC_LINK_ATTRIBUTE_LINK_TYPE]: "previous_trace"
      }
    });
    span.setAttribute(
      PREVIOUS_TRACE_TMP_SPAN_ATTRIBUTE,
      `${previousTraceSpanCtx.traceId}-${previousTraceSpanCtx.spanId}-${spanContextSampled(previousTraceSpanCtx) ? 1 : 0}`
    );
  }
  return updatedPreviousTraceInfo;
}
function storePreviousTraceInSessionStorage(previousTraceInfo) {
  try {
    WINDOW$4.sessionStorage.setItem(PREVIOUS_TRACE_KEY, JSON.stringify(previousTraceInfo));
  } catch (e2) {
    DEBUG_BUILD$2 && debug$2.warn("Could not store previous trace in sessionStorage", e2);
  }
}
function getPreviousTraceFromSessionStorage() {
  try {
    const previousTraceInfo = WINDOW$4.sessionStorage?.getItem(PREVIOUS_TRACE_KEY);
    return JSON.parse(previousTraceInfo);
  } catch {
    return void 0;
  }
}
function spanContextSampled(ctx) {
  return ctx.traceFlags === 1;
}
const BROWSER_TRACING_INTEGRATION_ID = "BrowserTracing";
const BOT_USER_AGENT_RE = /Googlebot|Google-InspectionTool|Storebot-Google|Bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|Facebot|facebookexternalhit|LinkedInBot|Twitterbot|Applebot/i;
function isBotUserAgent() {
  const nav = WINDOW$4.navigator;
  if (!nav?.userAgent) {
    return false;
  }
  return BOT_USER_AGENT_RE.test(nav.userAgent);
}
const DEFAULT_BROWSER_TRACING_OPTIONS = {
  ...TRACING_DEFAULTS,
  instrumentNavigation: true,
  instrumentPageLoad: true,
  markBackgroundSpan: true,
  enableLongTask: true,
  enableLongAnimationFrame: true,
  enableInp: true,
  ignoreResourceSpans: [],
  ignorePerformanceApiSpans: [],
  detectRedirects: true,
  linkPreviousTrace: "in-memory",
  consistentTraceSampling: false,
  enableReportPageLoaded: false,
  _experiments: {},
  ...defaultRequestInstrumentationOptions
};
const browserTracingIntegration = ((options = {}) => {
  if ("enableElementTiming" in options) {
    consoleSandbox(() => {
      console.warn(
        "[Sentry] `enableElementTiming` is deprecated and no longer has any effect. Use the standalone `elementTimingIntegration` instead."
      );
    });
  }
  const latestRoute = {
    name: void 0,
    source: void 0
  };
  const optionalWindowDocument = WINDOW$4.document;
  const {
    enableInp,
    enableLongTask,
    enableLongAnimationFrame,
    _experiments: { enableInteractions, enableStandaloneClsSpans, enableStandaloneLcpSpans },
    beforeStartSpan,
    idleTimeout,
    finalTimeout,
    childSpanTimeout,
    markBackgroundSpan,
    traceFetch,
    traceXHR,
    trackFetchStreamPerformance,
    shouldCreateSpanForRequest,
    enableHTTPTimings,
    ignoreResourceSpans,
    ignorePerformanceApiSpans,
    instrumentPageLoad,
    instrumentNavigation,
    detectRedirects,
    linkPreviousTrace,
    consistentTraceSampling,
    enableReportPageLoaded,
    onRequestSpanStart,
    onRequestSpanEnd
  } = {
    ...DEFAULT_BROWSER_TRACING_OPTIONS,
    ...options
  };
  const _isBot = isBotUserAgent();
  let _collectWebVitals;
  let lastInteractionTimestamp;
  let _pageloadSpan;
  function _createRouteSpan(client, startSpanOptions, makeActive = true) {
    const isPageloadSpan = startSpanOptions.op === "pageload";
    const initialSpanName = startSpanOptions.name;
    const finalStartSpanOptions = beforeStartSpan ? beforeStartSpan(startSpanOptions) : startSpanOptions;
    const attributes = finalStartSpanOptions.attributes || {};
    if (initialSpanName !== finalStartSpanOptions.name) {
      attributes[SEMANTIC_ATTRIBUTE_SENTRY_SOURCE] = "custom";
      finalStartSpanOptions.attributes = attributes;
    }
    if (!makeActive) {
      const now = dateTimestampInSeconds();
      startInactiveSpan({
        ...finalStartSpanOptions,
        startTime: now
      }).end(now);
      return;
    }
    latestRoute.name = finalStartSpanOptions.name;
    latestRoute.source = attributes[SEMANTIC_ATTRIBUTE_SENTRY_SOURCE];
    const idleSpan = startIdleSpan(finalStartSpanOptions, {
      idleTimeout,
      finalTimeout,
      childSpanTimeout,
      // should wait for finish signal if it's a pageload transaction
      disableAutoFinish: isPageloadSpan,
      beforeSpanEnd: (span) => {
        _collectWebVitals?.();
        const spanStreamingEnabled = hasSpanStreamingEnabled(client);
        addPerformanceEntries(span, {
          recordClsOnPageloadSpan: !spanStreamingEnabled && !enableStandaloneClsSpans,
          recordLcpOnPageloadSpan: !spanStreamingEnabled && !enableStandaloneLcpSpans,
          ignoreResourceSpans,
          ignorePerformanceApiSpans,
          spanStreamingEnabled
        });
        setActiveIdleSpan(client, void 0);
        const scope = getCurrentScope();
        const oldPropagationContext = scope.getPropagationContext();
        scope.setPropagationContext({
          ...oldPropagationContext,
          traceId: idleSpan.spanContext().traceId,
          sampled: spanIsSampled(idleSpan),
          dsc: getDynamicSamplingContextFromSpan(span)
        });
        if (isPageloadSpan) {
          _pageloadSpan = void 0;
        }
      },
      trimIdleSpanEndTimestamp: !enableReportPageLoaded
    });
    if (isPageloadSpan && enableReportPageLoaded) {
      _pageloadSpan = idleSpan;
    }
    setActiveIdleSpan(client, idleSpan);
    function emitFinish() {
      if (optionalWindowDocument && ["interactive", "complete"].includes(optionalWindowDocument.readyState)) {
        client.emit("idleSpanEnableAutoFinish", idleSpan);
      }
    }
    if (isPageloadSpan && !enableReportPageLoaded && optionalWindowDocument) {
      optionalWindowDocument.addEventListener("readystatechange", () => {
        emitFinish();
      });
      emitFinish();
    }
  }
  return {
    name: BROWSER_TRACING_INTEGRATION_ID,
    setup(client) {
      if (_isBot) {
        DEBUG_BUILD$2 && debug$2.log("[Tracing] Skipping browserTracingIntegration setup for bot user agent.");
        return;
      }
      registerSpanErrorInstrumentation();
      const spanStreamingEnabled = hasSpanStreamingEnabled(client);
      _collectWebVitals = startTrackingWebVitals({
        recordClsStandaloneSpans: spanStreamingEnabled ? void 0 : enableStandaloneClsSpans || false,
        recordLcpStandaloneSpans: spanStreamingEnabled ? void 0 : enableStandaloneLcpSpans || false,
        client
      });
      if (spanStreamingEnabled) {
        trackLcpAsSpan(client);
        trackClsAsSpan(client);
        if (enableInp) {
          trackInpAsSpan();
        }
      } else if (enableInp) {
        startTrackingINP();
      }
      if (enableLongAnimationFrame && GLOBAL_OBJ.PerformanceObserver && PerformanceObserver.supportedEntryTypes?.includes("long-animation-frame")) {
        startTrackingLongAnimationFrames();
      } else if (enableLongTask) {
        startTrackingLongTasks();
      }
      if (enableInteractions) {
        startTrackingInteractions();
      }
      if (detectRedirects && optionalWindowDocument) {
        const interactionHandler = () => {
          lastInteractionTimestamp = timestampInSeconds();
        };
        addEventListener("click", interactionHandler, { capture: true });
        addEventListener("keydown", interactionHandler, { capture: true, passive: true });
      }
      function maybeEndActiveSpan() {
        const activeSpan = getActiveIdleSpan(client);
        if (activeSpan && !spanToJSON(activeSpan).timestamp) {
          DEBUG_BUILD$2 && debug$2.log(`[Tracing] Finishing current active span with op: ${spanToJSON(activeSpan).op}`);
          activeSpan.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_IDLE_SPAN_FINISH_REASON, "cancelled");
          activeSpan.end();
        }
      }
      client.on("startNavigationSpan", (startSpanOptions, navigationOptions) => {
        if (getClient() !== client) {
          return;
        }
        if (navigationOptions?.isRedirect) {
          DEBUG_BUILD$2 && debug$2.warn("[Tracing] Detected redirect, navigation span will not be the root span, but a child span.");
          _createRouteSpan(
            client,
            {
              op: "navigation.redirect",
              ...startSpanOptions
            },
            false
          );
          return;
        }
        lastInteractionTimestamp = void 0;
        maybeEndActiveSpan();
        getIsolationScope().setPropagationContext({
          traceId: generateTraceId(),
          sampleRand: Math.random(),
          propagationSpanId: hasSpansEnabled() ? void 0 : generateSpanId()
        });
        const scope = getCurrentScope();
        scope.setPropagationContext({
          traceId: generateTraceId(),
          sampleRand: Math.random(),
          propagationSpanId: hasSpansEnabled() ? void 0 : generateSpanId()
        });
        scope.setSDKProcessingMetadata({
          normalizedRequest: void 0
        });
        _createRouteSpan(client, {
          op: "navigation",
          ...startSpanOptions,
          // Navigation starts a new trace and is NOT parented under any active interaction (e.g. ui.action.click)
          parentSpan: null,
          forceTransaction: true
        });
      });
      client.on("startPageLoadSpan", (startSpanOptions, traceOptions = {}) => {
        if (getClient() !== client) {
          return;
        }
        maybeEndActiveSpan();
        const sentryTrace = traceOptions.sentryTrace || getMetaContent("sentry-trace") || getServerTiming("sentry-trace");
        const baggage = traceOptions.baggage || getMetaContent("baggage") || getServerTiming("baggage");
        const propagationContext = propagationContextFromHeaders(sentryTrace, baggage);
        const scope = getCurrentScope();
        scope.setPropagationContext(propagationContext);
        if (!hasSpansEnabled()) {
          scope.getPropagationContext().propagationSpanId = generateSpanId();
        }
        scope.setSDKProcessingMetadata({
          normalizedRequest: getHttpRequestData()
        });
        _createRouteSpan(client, {
          op: "pageload",
          ...startSpanOptions
        });
      });
      client.on("endPageloadSpan", () => {
        if (enableReportPageLoaded && _pageloadSpan) {
          _pageloadSpan.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_IDLE_SPAN_FINISH_REASON, "reportPageLoaded");
          _pageloadSpan.end();
        }
      });
    },
    afterAllSetup(client) {
      if (_isBot) {
        return;
      }
      let startingUrl = getLocationHref();
      if (linkPreviousTrace !== "off") {
        linkTraces(client, { linkPreviousTrace, consistentTraceSampling });
      }
      if (WINDOW$4.location) {
        if (instrumentPageLoad) {
          const origin = browserPerformanceTimeOrigin();
          startBrowserTracingPageLoadSpan(client, {
            name: WINDOW$4.location.pathname,
            // pageload should always start at timeOrigin (and needs to be in s, not ms)
            startTime: origin ? origin / 1e3 : void 0,
            attributes: {
              [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: "url",
              [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.pageload.browser"
            }
          });
        }
        if (instrumentNavigation) {
          addHistoryInstrumentationHandler(({ to, from }) => {
            if (from === void 0 && startingUrl?.indexOf(to) !== -1) {
              startingUrl = void 0;
              return;
            }
            startingUrl = void 0;
            const parsed = parseStringToURLObject(to);
            const activeSpan = getActiveIdleSpan(client);
            const navigationIsRedirect = activeSpan && detectRedirects && isRedirect(activeSpan, lastInteractionTimestamp);
            startBrowserTracingNavigationSpan(
              client,
              {
                name: parsed?.pathname || WINDOW$4.location.pathname,
                attributes: {
                  [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: "url",
                  [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.navigation.browser"
                }
              },
              { url: to, isRedirect: navigationIsRedirect }
            );
          });
        }
      }
      if (markBackgroundSpan) {
        registerBackgroundTabDetection();
      }
      if (enableInteractions) {
        registerInteractionListener(client, idleTimeout, finalTimeout, childSpanTimeout, latestRoute);
      }
      if (enableInp) {
        registerInpInteractionListener();
      }
      instrumentOutgoingRequests(client, {
        traceFetch,
        traceXHR,
        tracePropagationTargets: client.getOptions().tracePropagationTargets,
        shouldCreateSpanForRequest,
        enableHTTPTimings,
        onRequestSpanStart,
        onRequestSpanEnd
      });
      if (trackFetchStreamPerformance) {
        client.addIntegration(fetchStreamPerformanceIntegration());
      }
    }
  };
});
function startBrowserTracingPageLoadSpan(client, spanOptions, traceOptions) {
  client.emit("startPageLoadSpan", spanOptions, traceOptions);
  getCurrentScope().setTransactionName(spanOptions.name);
  const pageloadSpan = getActiveIdleSpan(client);
  if (pageloadSpan) {
    client.emit("afterStartPageLoadSpan", pageloadSpan);
  }
  return pageloadSpan;
}
function startBrowserTracingNavigationSpan(client, spanOptions, options) {
  const { url, isRedirect: isRedirect2 } = options || {};
  client.emit("beforeStartNavigationSpan", spanOptions, { isRedirect: isRedirect2 });
  client.emit("startNavigationSpan", spanOptions, { isRedirect: isRedirect2 });
  const scope = getCurrentScope();
  scope.setTransactionName(spanOptions.name);
  if (url && !isRedirect2) {
    scope.setSDKProcessingMetadata({
      normalizedRequest: {
        ...getHttpRequestData(),
        url
      }
    });
  }
  return getActiveIdleSpan(client);
}
function getMetaContent(metaName) {
  const optionalWindowDocument = WINDOW$4.document;
  const metaTag = optionalWindowDocument?.querySelector(`meta[name=${metaName}]`);
  return metaTag?.getAttribute("content") || void 0;
}
function getServerTiming(name) {
  const navigation = WINDOW$4.performance?.getEntriesByType?.("navigation")[0];
  const entry = navigation?.serverTiming?.find((entry2) => entry2.name === name);
  return entry?.description;
}
function registerInteractionListener(client, idleTimeout, finalTimeout, childSpanTimeout, latestRoute) {
  const optionalWindowDocument = WINDOW$4.document;
  let inflightInteractionSpan;
  const registerInteractionTransaction = () => {
    const op = "ui.action.click";
    const activeIdleSpan = getActiveIdleSpan(client);
    if (activeIdleSpan) {
      const currentRootSpanOp = spanToJSON(activeIdleSpan).op;
      if (["navigation", "pageload"].includes(currentRootSpanOp)) {
        DEBUG_BUILD$2 && debug$2.warn(`[Tracing] Did not create ${op} span because a pageload or navigation span is in progress.`);
        return void 0;
      }
    }
    if (inflightInteractionSpan) {
      inflightInteractionSpan.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_IDLE_SPAN_FINISH_REASON, "interactionInterrupted");
      inflightInteractionSpan.end();
      inflightInteractionSpan = void 0;
    }
    if (!latestRoute.name) {
      DEBUG_BUILD$2 && debug$2.warn(`[Tracing] Did not create ${op} transaction because _latestRouteName is missing.`);
      return void 0;
    }
    inflightInteractionSpan = startIdleSpan(
      {
        name: latestRoute.name,
        op,
        attributes: {
          [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: latestRoute.source || "url"
        }
      },
      {
        idleTimeout,
        finalTimeout,
        childSpanTimeout
      }
    );
  };
  if (optionalWindowDocument) {
    addEventListener("click", registerInteractionTransaction, { capture: true });
  }
}
const ACTIVE_IDLE_SPAN_PROPERTY = "_sentry_idleSpan";
function getActiveIdleSpan(client) {
  return client[ACTIVE_IDLE_SPAN_PROPERTY];
}
function setActiveIdleSpan(client, span) {
  addNonEnumerableProperty(client, ACTIVE_IDLE_SPAN_PROPERTY, span);
}
const REDIRECT_THRESHOLD = 1.5;
function isRedirect(activeSpan, lastInteractionTimestamp) {
  const spanData = spanToJSON(activeSpan);
  const now = dateTimestampInSeconds();
  const startTimestamp = spanData.start_timestamp;
  if (now - startTimestamp > REDIRECT_THRESHOLD) {
    return false;
  }
  if (lastInteractionTimestamp && now - lastInteractionTimestamp <= REDIRECT_THRESHOLD) {
    return false;
  }
  return true;
}
function reportPageLoaded(client = getClient()) {
  client?.emit("endPageloadSpan");
}
function setActiveSpanInBrowser(span) {
  const maybePreviousActiveSpan = getActiveSpan();
  if (maybePreviousActiveSpan === span) {
    return;
  }
  const scope = getCurrentScope();
  span.end = new Proxy(span.end, {
    apply(target, thisArg, args) {
      _setSpanForScope(scope, maybePreviousActiveSpan);
      return Reflect.apply(target, thisArg, args);
    }
  });
  _setSpanForScope(scope, span);
}
const spanStreamingIntegration = defineIntegration(() => {
  return {
    name: "SpanStreaming",
    beforeSetup(client) {
      const clientOptions = client.getOptions();
      if (!clientOptions.traceLifecycle) {
        DEBUG_BUILD$2 && debug$2.log('[SpanStreaming] setting `traceLifecycle` to "stream"');
        clientOptions.traceLifecycle = "stream";
      }
    },
    setup(client) {
      const initialMessage = "SpanStreaming integration requires";
      const fallbackMsg = "Falling back to static trace lifecycle.";
      const clientOptions = client.getOptions();
      if (!hasSpanStreamingEnabled(client)) {
        clientOptions.traceLifecycle = "static";
        DEBUG_BUILD$2 && debug$2.warn(`${initialMessage} \`traceLifecycle\` to be set to "stream"! ${fallbackMsg}`);
        return;
      }
      const beforeSendSpan = clientOptions.beforeSendSpan;
      if (beforeSendSpan && !isStreamedBeforeSendSpanCallback(beforeSendSpan)) {
        clientOptions.traceLifecycle = "static";
        DEBUG_BUILD$2 && debug$2.warn(`${initialMessage} a beforeSendSpan callback using \`withStreamedSpan\`! ${fallbackMsg}`);
        return;
      }
      const buffer = new SpanBuffer(client);
      client.on("afterSpanEnd", (span) => {
        if (!spanIsSampled(span)) {
          return;
        }
        buffer.add(captureSpan(span, client));
      });
      client.on("afterSegmentSpanEnd", (segmentSpan) => {
        const traceId = segmentSpan.spanContext().traceId;
        setTimeout(() => {
          buffer.flush(traceId);
        }, 500);
      });
    }
  };
});
function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.oncomplete = request.onsuccess = () => resolve(request.result);
    request.onabort = request.onerror = () => reject(request.error);
  });
}
function createStore(dbName, storeName) {
  const request = indexedDB.open(dbName);
  request.onupgradeneeded = () => request.result.createObjectStore(storeName);
  const dbp = promisifyRequest(request);
  return (callback) => dbp.then((db) => callback(db.transaction(storeName, "readwrite").objectStore(storeName)));
}
function keys(store) {
  return promisifyRequest(store.getAllKeys());
}
function push(store, value, maxQueueSize) {
  return store((store2) => {
    return keys(store2).then((keys2) => {
      if (keys2.length >= maxQueueSize) {
        return;
      }
      store2.put(value, Math.max(...keys2, 0) + 1);
      return promisifyRequest(store2.transaction);
    });
  });
}
function unshift(store, value, maxQueueSize) {
  return store((store2) => {
    return keys(store2).then((keys2) => {
      if (keys2.length >= maxQueueSize) {
        return;
      }
      store2.put(value, Math.min(...keys2, 0) - 1);
      return promisifyRequest(store2.transaction);
    });
  });
}
function shift(store) {
  return store((store2) => {
    return keys(store2).then((keys2) => {
      const firstKey = keys2[0];
      if (firstKey == null) {
        return void 0;
      }
      return promisifyRequest(store2.get(firstKey)).then((value) => {
        store2.delete(firstKey);
        return promisifyRequest(store2.transaction).then(() => value);
      });
    });
  });
}
function createIndexedDbStore(options) {
  let store;
  function getStore() {
    if (store == void 0) {
      store = createStore(options.dbName || "sentry-offline", options.storeName || "queue");
    }
    return store;
  }
  return {
    push: async (env) => {
      try {
        const serialized = serializeEnvelope(env);
        await push(getStore(), serialized, options.maxQueueSize || 30);
      } catch {
      }
    },
    unshift: async (env) => {
      try {
        const serialized = serializeEnvelope(env);
        await unshift(getStore(), serialized, options.maxQueueSize || 30);
      } catch {
      }
    },
    shift: async () => {
      try {
        const deserialized = await shift(getStore());
        if (deserialized) {
          return parseEnvelope(deserialized);
        }
      } catch {
      }
      return void 0;
    }
  };
}
function makeIndexedDbOfflineTransport(createTransport2) {
  return (options) => {
    const transport = createTransport2({ ...options, createStore: createIndexedDbStore });
    WINDOW$4.addEventListener("online", async (_2) => {
      await transport.flush();
    });
    return transport;
  };
}
function makeBrowserOfflineTransport(createTransport2 = makeFetchTransport) {
  return makeIndexedDbOfflineTransport(makeOfflineTransport(createTransport2));
}
const MS_TO_NS = 1e6;
const isMainThread = "window" in GLOBAL_OBJ && GLOBAL_OBJ.window === GLOBAL_OBJ && typeof importScripts === "undefined";
const PROFILER_THREAD_ID_STRING = String(0);
const PROFILER_THREAD_NAME = isMainThread ? "main" : "worker";
const navigator = WINDOW$4.navigator;
let OS_PLATFORM = "";
let OS_PLATFORM_VERSION = "";
let OS_ARCH = "";
let OS_BROWSER = navigator?.userAgent || "";
let OS_MODEL = "";
const OS_LOCALE = navigator?.language || navigator?.languages?.[0] || "";
function isUserAgentData(data) {
  return typeof data === "object" && data !== null && "getHighEntropyValues" in data;
}
const userAgentData = navigator?.userAgentData;
if (isUserAgentData(userAgentData)) {
  userAgentData.getHighEntropyValues(["architecture", "model", "platform", "platformVersion", "fullVersionList"]).then((ua) => {
    OS_PLATFORM = ua.platform || "";
    OS_ARCH = ua.architecture || "";
    OS_MODEL = ua.model || "";
    OS_PLATFORM_VERSION = ua.platformVersion || "";
    if (ua.fullVersionList?.length) {
      const firstUa = ua.fullVersionList[ua.fullVersionList.length - 1];
      OS_BROWSER = `${firstUa.brand} ${firstUa.version}`;
    }
  }).catch((e2) => void 0);
}
function isProcessedJSSelfProfile(profile) {
  return !("thread_metadata" in profile);
}
function enrichWithThreadInformation(profile) {
  if (!isProcessedJSSelfProfile(profile)) {
    return profile;
  }
  return convertJSSelfProfileToSampledFormat(profile);
}
function getTraceId(event) {
  const traceId = event.contexts?.trace?.trace_id;
  if (typeof traceId === "string" && traceId.length !== 32) {
    if (DEBUG_BUILD$2) {
      debug$2.log(`[Profiling] Invalid traceId: ${traceId} on profiled event`);
    }
  }
  if (typeof traceId !== "string") {
    return "";
  }
  return traceId;
}
function createProfilePayload(profile_id, start_timestamp, processed_profile, event) {
  if (event.type !== "transaction") {
    throw new TypeError("Profiling events may only be attached to transactions, this should never occur.");
  }
  if (processed_profile === void 0 || processed_profile === null) {
    throw new TypeError(
      `Cannot construct profiling event envelope without a valid profile. Got ${processed_profile} instead.`
    );
  }
  const traceId = getTraceId(event);
  const enrichedThreadProfile = enrichWithThreadInformation(processed_profile);
  const transactionStartMs = start_timestamp ? start_timestamp : typeof event.start_timestamp === "number" ? event.start_timestamp * 1e3 : timestampInSeconds() * 1e3;
  const transactionEndMs = typeof event.timestamp === "number" ? event.timestamp * 1e3 : timestampInSeconds() * 1e3;
  const profile = {
    event_id: profile_id,
    timestamp: new Date(transactionStartMs).toISOString(),
    platform: "javascript",
    version: "1",
    release: event.release || "",
    environment: event.environment || DEFAULT_ENVIRONMENT,
    runtime: {
      name: "javascript",
      version: WINDOW$4.navigator.userAgent
    },
    os: {
      name: OS_PLATFORM,
      version: OS_PLATFORM_VERSION,
      build_number: OS_BROWSER
    },
    device: {
      locale: OS_LOCALE,
      model: OS_MODEL,
      manufacturer: OS_BROWSER,
      architecture: OS_ARCH,
      is_emulator: false
    },
    debug_meta: {
      images: applyDebugMetadata(processed_profile.resources)
    },
    profile: enrichedThreadProfile,
    transactions: [
      {
        name: event.transaction || "",
        id: event.event_id || uuid4(),
        trace_id: traceId,
        active_thread_id: PROFILER_THREAD_ID_STRING,
        relative_start_ns: "0",
        relative_end_ns: ((transactionEndMs - transactionStartMs) * 1e6).toFixed(0)
      }
    ]
  };
  return profile;
}
function createProfileChunkPayload(jsSelfProfile, client, profilerId) {
  if (jsSelfProfile == null) {
    throw new TypeError(
      `Cannot construct profiling event envelope without a valid profile. Got ${jsSelfProfile} instead.`
    );
  }
  const continuousProfile = convertToContinuousProfile(jsSelfProfile);
  const options = client.getOptions();
  const sdk = client.getSdkMetadata?.()?.sdk;
  return {
    chunk_id: uuid4(),
    client_sdk: {
      name: sdk?.name ?? "sentry.javascript.browser",
      version: sdk?.version ?? "0.0.0"
    },
    profiler_id: profilerId || uuid4(),
    platform: "javascript",
    version: "2",
    release: options.release ?? "",
    environment: options.environment ?? "production",
    debug_meta: {
      // function name obfuscation
      images: applyDebugMetadata(jsSelfProfile.resources)
    },
    profile: continuousProfile
  };
}
function validateProfileChunk(chunk) {
  try {
    if (!chunk || typeof chunk !== "object") {
      return { reason: "chunk is not an object" };
    }
    const isHex32 = (val) => typeof val === "string" && /^[a-f0-9]{32}$/.test(val);
    if (!isHex32(chunk.profiler_id)) {
      return { reason: "missing or invalid profiler_id" };
    }
    if (!isHex32(chunk.chunk_id)) {
      return { reason: "missing or invalid chunk_id" };
    }
    if (!chunk.client_sdk) {
      return { reason: "missing client_sdk metadata" };
    }
    const profile = chunk.profile;
    if (!profile) {
      return { reason: "missing profile data" };
    }
    if (!Array.isArray(profile.frames) || !profile.frames.length) {
      return { reason: "profile has no frames" };
    }
    if (!Array.isArray(profile.stacks) || !profile.stacks.length) {
      return { reason: "profile has no stacks" };
    }
    if (!Array.isArray(profile.samples) || !profile.samples.length) {
      return { reason: "profile has no samples" };
    }
    return { valid: true };
  } catch (e2) {
    return { reason: `unknown validation error: ${e2}` };
  }
}
function convertToContinuousProfile(input) {
  const frames = [];
  for (let i = 0; i < input.frames.length; i++) {
    const frame = input.frames[i];
    if (!frame) {
      continue;
    }
    frames[i] = {
      function: frame.name,
      abs_path: typeof frame.resourceId === "number" ? input.resources[frame.resourceId] : void 0,
      lineno: frame.line,
      colno: frame.column
    };
  }
  const stacks = [];
  for (let i = 0; i < input.stacks.length; i++) {
    const stackHead = input.stacks[i];
    if (!stackHead) {
      continue;
    }
    const list = [];
    let current = stackHead;
    while (current) {
      list.push(current.frameId);
      current = current.parentId === void 0 ? void 0 : input.stacks[current.parentId];
    }
    stacks[i] = list;
  }
  const perfOrigin = browserPerformanceTimeOrigin();
  const origin = typeof performance.timeOrigin === "number" ? performance.timeOrigin : perfOrigin || 0;
  const adjustForOriginChange = origin - (perfOrigin || origin);
  const samples = [];
  for (let i = 0; i < input.samples.length; i++) {
    const sample = input.samples[i];
    if (!sample) {
      continue;
    }
    const timestampSeconds = (origin + (sample.timestamp - adjustForOriginChange)) / 1e3;
    samples[i] = {
      stack_id: sample.stackId ?? 0,
      thread_id: PROFILER_THREAD_ID_STRING,
      timestamp: timestampSeconds
    };
  }
  return {
    frames,
    stacks,
    samples,
    thread_metadata: { [PROFILER_THREAD_ID_STRING]: { name: PROFILER_THREAD_NAME } }
  };
}
function isAutomatedPageLoadSpan(span) {
  return spanToJSON(span).op === "pageload";
}
function convertJSSelfProfileToSampledFormat(input) {
  let EMPTY_STACK_ID = void 0;
  let STACK_ID = 0;
  const profile = {
    samples: [],
    stacks: [],
    frames: [],
    thread_metadata: {
      [PROFILER_THREAD_ID_STRING]: { name: PROFILER_THREAD_NAME }
    }
  };
  const firstSample = input.samples[0];
  if (!firstSample) {
    return profile;
  }
  const start = firstSample.timestamp;
  const perfOrigin = browserPerformanceTimeOrigin();
  const origin = typeof performance.timeOrigin === "number" ? performance.timeOrigin : perfOrigin || 0;
  const adjustForOriginChange = origin - (perfOrigin || origin);
  input.samples.forEach((jsSample, i) => {
    if (jsSample.stackId === void 0) {
      if (EMPTY_STACK_ID === void 0) {
        EMPTY_STACK_ID = STACK_ID;
        profile.stacks[EMPTY_STACK_ID] = [];
        STACK_ID++;
      }
      profile["samples"][i] = {
        // convert ms timestamp to ns
        elapsed_since_start_ns: ((jsSample.timestamp + adjustForOriginChange - start) * MS_TO_NS).toFixed(0),
        stack_id: EMPTY_STACK_ID,
        thread_id: PROFILER_THREAD_ID_STRING
      };
      return;
    }
    let stackTop = input.stacks[jsSample.stackId];
    const stack = [];
    while (stackTop) {
      stack.push(stackTop.frameId);
      const frame = input.frames[stackTop.frameId];
      if (frame && profile.frames[stackTop.frameId] === void 0) {
        profile.frames[stackTop.frameId] = {
          function: frame.name,
          abs_path: typeof frame.resourceId === "number" ? input.resources[frame.resourceId] : void 0,
          lineno: frame.line,
          colno: frame.column
        };
      }
      stackTop = stackTop.parentId === void 0 ? void 0 : input.stacks[stackTop.parentId];
    }
    const sample = {
      // convert ms timestamp to ns
      elapsed_since_start_ns: ((jsSample.timestamp + adjustForOriginChange - start) * MS_TO_NS).toFixed(0),
      stack_id: STACK_ID,
      thread_id: PROFILER_THREAD_ID_STRING
    };
    profile["stacks"][STACK_ID] = stack;
    profile["samples"][i] = sample;
    STACK_ID++;
  });
  return profile;
}
function addProfilesToEnvelope(envelope, profiles) {
  if (!profiles.length) {
    return envelope;
  }
  for (const profile of profiles) {
    envelope[1].push([{ type: "profile" }, profile]);
  }
  return envelope;
}
function findProfiledTransactionsFromEnvelope(envelope) {
  const events = [];
  forEachEnvelopeItem(envelope, (item, type) => {
    if (type !== "transaction") {
      return;
    }
    for (let j2 = 1; j2 < item.length; j2++) {
      const event = item[j2];
      if (event?.contexts?.profile?.profile_id) {
        events.push(item[j2]);
      }
    }
  });
  return events;
}
function applyDebugMetadata(resource_paths) {
  const client = getClient();
  const options = client?.getOptions();
  const stackParser = options?.stackParser;
  if (!stackParser) {
    return [];
  }
  return getDebugImagesForResources(stackParser, resource_paths);
}
function isValidSampleRate(rate) {
  if (typeof rate !== "number" && typeof rate !== "boolean" || typeof rate === "number" && isNaN(rate)) {
    DEBUG_BUILD$2 && debug$2.warn(
      `[Profiling] Invalid sample rate. Sample rate must be a boolean or a number between 0 and 1. Got ${JSON.stringify(
        rate
      )} of type ${JSON.stringify(typeof rate)}.`
    );
    return false;
  }
  if (rate === true || rate === false) {
    return true;
  }
  if (rate < 0 || rate > 1) {
    DEBUG_BUILD$2 && debug$2.warn(`[Profiling] Invalid sample rate. Sample rate must be between 0 and 1. Got ${rate}.`);
    return false;
  }
  return true;
}
function isValidProfile(profile) {
  if (profile.samples.length < 2) {
    if (DEBUG_BUILD$2) {
      debug$2.log("[Profiling] Discarding profile because it contains less than 2 samples");
    }
    return false;
  }
  if (!profile.frames.length) {
    if (DEBUG_BUILD$2) {
      debug$2.log("[Profiling] Discarding profile because it contains no frames");
    }
    return false;
  }
  return true;
}
let PROFILING_CONSTRUCTOR_FAILED = false;
const MAX_PROFILE_DURATION_MS = 3e4;
function isJSProfilerSupported(maybeProfiler) {
  return typeof maybeProfiler === "function";
}
function startJSSelfProfile() {
  const JSProfilerConstructor = WINDOW$4.Profiler;
  if (!isJSProfilerSupported(JSProfilerConstructor)) {
    if (DEBUG_BUILD$2) {
      debug$2.log("[Profiling] Profiling is not supported by this browser, Profiler interface missing on window object.");
    }
    return;
  }
  const samplingIntervalMS = 10;
  const maxSamples = Math.floor(MAX_PROFILE_DURATION_MS / samplingIntervalMS);
  try {
    return new JSProfilerConstructor({ sampleInterval: samplingIntervalMS, maxBufferSize: maxSamples });
  } catch (_e) {
    if (DEBUG_BUILD$2) {
      debug$2.log(
        "[Profiling] Failed to initialize the Profiling constructor, this is likely due to a missing 'Document-Policy': 'js-profiling' header."
      );
      debug$2.log("[Profiling] Disabling profiling for current user session.");
    }
    PROFILING_CONSTRUCTOR_FAILED = true;
  }
  return;
}
function shouldProfileSpanLegacy(span) {
  if (PROFILING_CONSTRUCTOR_FAILED) {
    if (DEBUG_BUILD$2) {
      debug$2.log("[Profiling] Profiling has been disabled for the duration of the current user session.");
    }
    return false;
  }
  if (!span.isRecording()) {
    DEBUG_BUILD$2 && debug$2.log("[Profiling] Discarding profile because root span was not sampled.");
    return false;
  }
  const client = getClient();
  const options = client?.getOptions();
  if (!options) {
    DEBUG_BUILD$2 && debug$2.log("[Profiling] Profiling disabled, no options found.");
    return false;
  }
  const profilesSampleRate = options.profilesSampleRate;
  if (!isValidSampleRate(profilesSampleRate)) {
    DEBUG_BUILD$2 && debug$2.warn("[Profiling] Discarding profile because of invalid sample rate.");
    return false;
  }
  if (!profilesSampleRate) {
    DEBUG_BUILD$2 && debug$2.log(
      "[Profiling] Discarding profile because a negative sampling decision was inherited or profileSampleRate is set to 0"
    );
    return false;
  }
  const sampled = profilesSampleRate === true ? true : Math.random() < profilesSampleRate;
  if (!sampled) {
    DEBUG_BUILD$2 && debug$2.log(
      `[Profiling] Discarding profile because it's not included in the random sample (sampling rate = ${Number(
        profilesSampleRate
      )})`
    );
    return false;
  }
  return true;
}
function shouldProfileSession(options) {
  if (PROFILING_CONSTRUCTOR_FAILED) {
    if (DEBUG_BUILD$2) {
      debug$2.log(
        "[Profiling] Profiling has been disabled for the duration of the current user session as the JS Profiler could not be started."
      );
    }
    return false;
  }
  if (options.profileLifecycle !== "trace" && options.profileLifecycle !== "manual") {
    DEBUG_BUILD$2 && debug$2.warn("[Profiling] Session not sampled. Invalid `profileLifecycle` option.");
    return false;
  }
  const profileSessionSampleRate = options.profileSessionSampleRate;
  if (!isValidSampleRate(profileSessionSampleRate)) {
    DEBUG_BUILD$2 && debug$2.warn("[Profiling] Discarding profile because of invalid profileSessionSampleRate.");
    return false;
  }
  if (!profileSessionSampleRate) {
    DEBUG_BUILD$2 && debug$2.log("[Profiling] Discarding profile because profileSessionSampleRate is not defined or set to 0");
    return false;
  }
  return Math.random() <= profileSessionSampleRate;
}
function hasLegacyProfiling(options) {
  return typeof options.profilesSampleRate !== "undefined";
}
function createProfilingEvent(profile_id, start_timestamp, profile, event) {
  if (!isValidProfile(profile)) {
    return null;
  }
  return createProfilePayload(profile_id, start_timestamp, profile, event);
}
const PROFILE_MAP = /* @__PURE__ */ new Map();
function getActiveProfilesCount() {
  return PROFILE_MAP.size;
}
function takeProfileFromGlobalCache(profile_id) {
  const profile = PROFILE_MAP.get(profile_id);
  if (profile) {
    PROFILE_MAP.delete(profile_id);
  }
  return profile;
}
function addProfileToGlobalCache(profile_id, profile) {
  PROFILE_MAP.set(profile_id, profile);
  if (PROFILE_MAP.size > 30) {
    const last = PROFILE_MAP.keys().next().value;
    if (last !== void 0) {
      PROFILE_MAP.delete(last);
    }
  }
}
const PROFILED_ROOT_SPANS = /* @__PURE__ */ new WeakSet();
function setThreadAttributes(span) {
  span.setAttribute("thread.id", PROFILER_THREAD_ID_STRING);
  span.setAttribute("thread.name", PROFILER_THREAD_NAME);
}
function startProfileForSpan(span) {
  let startTimestamp;
  if (isAutomatedPageLoadSpan(span)) {
    startTimestamp = timestampInSeconds() * 1e3;
  }
  const profiler = startJSSelfProfile();
  if (!profiler) {
    return;
  }
  if (DEBUG_BUILD$2) {
    debug$2.log(`[Profiling] started profiling span: ${spanToJSON(span).description}`);
  }
  const profileId = uuid4();
  let processedProfile = null;
  getCurrentScope().setContext("profile", {
    profile_id: profileId,
    start_timestamp: startTimestamp
  });
  PROFILED_ROOT_SPANS.add(span);
  setThreadAttributes(span);
  async function onProfileHandler() {
    if (!span) {
      return;
    }
    if (!profiler) {
      return;
    }
    if (processedProfile) {
      if (DEBUG_BUILD$2) {
        debug$2.log("[Profiling] profile for:", spanToJSON(span).description, "already exists, returning early");
      }
      return;
    }
    return profiler.stop().then((profile) => {
      if (maxDurationTimeoutID) {
        WINDOW$4.clearTimeout(maxDurationTimeoutID);
        maxDurationTimeoutID = void 0;
      }
      if (DEBUG_BUILD$2) {
        debug$2.log(`[Profiling] stopped profiling of span: ${spanToJSON(span).description}`);
      }
      if (!profile) {
        if (DEBUG_BUILD$2) {
          debug$2.log(
            `[Profiling] profiler returned null profile for: ${spanToJSON(span).description}`,
            "this may indicate an overlapping span or a call to stopProfiling with a profile title that was never started"
          );
        }
        return;
      }
      processedProfile = profile;
      addProfileToGlobalCache(profileId, profile);
    }).catch((error2) => {
      if (DEBUG_BUILD$2) {
        debug$2.log("[Profiling] error while stopping profiler:", error2);
      }
    });
  }
  let maxDurationTimeoutID = WINDOW$4.setTimeout(() => {
    if (DEBUG_BUILD$2) {
      debug$2.log("[Profiling] max profile duration elapsed, stopping profiling for:", spanToJSON(span).description);
    }
    onProfileHandler();
  }, MAX_PROFILE_DURATION_MS);
  const originalEnd = span.end.bind(span);
  function profilingWrappedSpanEnd() {
    if (!span) {
      return originalEnd();
    }
    void onProfileHandler().then(
      () => {
        originalEnd();
      },
      () => {
        originalEnd();
      }
    );
    return span;
  }
  span.end = profilingWrappedSpanEnd;
}
const CHUNK_INTERVAL_MS = 6e4;
const MAX_ROOT_SPAN_PROFILE_MS = 3e5;
class UIProfiler {
  constructor() {
    this._client = void 0;
    this._profiler = void 0;
    this._chunkTimer = void 0;
    this._profilerId = void 0;
    this._isRunning = false;
    this._sessionSampled = false;
    this._lifecycleMode = void 0;
    this._activeRootSpanIds = /* @__PURE__ */ new Set();
    this._rootSpanTimeouts = /* @__PURE__ */ new Map();
  }
  /**
   * Initialize the profiler with client, session sampling and lifecycle mode.
   */
  initialize(client) {
    const lifecycleMode = client.getOptions().profileLifecycle;
    const sessionSampled = shouldProfileSession(client.getOptions());
    DEBUG_BUILD$2 && debug$2.log(`[Profiling] Initializing profiler (lifecycle='${lifecycleMode}').`);
    if (!sessionSampled) {
      DEBUG_BUILD$2 && debug$2.log("[Profiling] Session not sampled. Skipping lifecycle profiler initialization.");
    }
    this._profilerId = uuid4();
    this._client = client;
    this._sessionSampled = sessionSampled;
    this._lifecycleMode = lifecycleMode;
    if (lifecycleMode === "trace") {
      this._setupTraceLifecycleListeners(client);
    }
    client.on("spanStart", (span) => {
      if (this._isRunning) {
        setThreadAttributes(span);
      }
    });
  }
  /** Starts UI profiling (only effective in 'manual' mode and when sampled). */
  start() {
    if (this._lifecycleMode === "trace") {
      DEBUG_BUILD$2 && debug$2.warn(
        '[Profiling] `profileLifecycle` is set to "trace". Calls to `uiProfiler.start()` are ignored in trace mode.'
      );
      return;
    }
    if (this._isRunning) {
      DEBUG_BUILD$2 && debug$2.warn("[Profiling] Profile session is already running, `uiProfiler.start()` is a no-op.");
      return;
    }
    if (!this._sessionSampled) {
      DEBUG_BUILD$2 && debug$2.warn("[Profiling] Session is not sampled, `uiProfiler.start()` is a no-op.");
      return;
    }
    this._beginProfiling();
  }
  /** Stops UI profiling (only effective in 'manual' mode). */
  stop() {
    if (this._lifecycleMode === "trace") {
      DEBUG_BUILD$2 && debug$2.warn(
        '[Profiling] `profileLifecycle` is set to "trace". Calls to `uiProfiler.stop()` are ignored in trace mode.'
      );
      return;
    }
    if (!this._isRunning) {
      DEBUG_BUILD$2 && debug$2.warn("[Profiling] Profiler is not running, `uiProfiler.stop()` is a no-op.");
      return;
    }
    this._endProfiling();
  }
  /** Handle an already-active root span at integration setup time (used only in trace mode). */
  notifyRootSpanActive(rootSpan) {
    if (this._lifecycleMode !== "trace" || !this._sessionSampled) {
      return;
    }
    const spanId = rootSpan.spanContext().spanId;
    if (!spanId || this._activeRootSpanIds.has(spanId)) {
      return;
    }
    this._registerTraceRootSpan(spanId);
    const rootSpanCount = this._activeRootSpanIds.size;
    if (rootSpanCount === 1) {
      DEBUG_BUILD$2 && debug$2.log("[Profiling] Detected already active root span during setup. Active root spans now:", rootSpanCount);
      this._beginProfiling();
    }
    if (this._isRunning) {
      setThreadAttributes(rootSpan);
    }
  }
  /**
   * Begin profiling if not already running.
   */
  _beginProfiling() {
    if (this._isRunning) {
      return;
    }
    this._isRunning = true;
    DEBUG_BUILD$2 && debug$2.log("[Profiling] Started profiling with profiler ID:", this._profilerId);
    getGlobalScope().setContext("profile", { profiler_id: this._profilerId });
    this._startProfilerInstance();
    if (!this._profiler) {
      DEBUG_BUILD$2 && debug$2.log("[Profiling] Failed to start JS Profiler; stopping.");
      this._resetProfilerInfo();
      return;
    }
    this._startPeriodicChunking();
  }
  /** End profiling session; final chunk will be collected and sent. */
  _endProfiling() {
    if (!this._isRunning) {
      return;
    }
    this._isRunning = false;
    if (this._chunkTimer) {
      clearTimeout(this._chunkTimer);
      this._chunkTimer = void 0;
    }
    this._clearAllRootSpanTimeouts();
    this._collectCurrentChunk().catch((e2) => {
      DEBUG_BUILD$2 && debug$2.error("[Profiling] Failed to collect current profile chunk on `stop()`:", e2);
    });
    if (this._lifecycleMode === "manual") {
      getGlobalScope().setContext("profile", {});
    }
  }
  /** Trace-mode: attach spanStart/spanEnd listeners. */
  _setupTraceLifecycleListeners(client) {
    client.on("spanStart", (span) => {
      if (!this._sessionSampled) {
        DEBUG_BUILD$2 && debug$2.log("[Profiling] Span not profiled because of negative sampling decision for user session.");
        return;
      }
      if (span !== getRootSpan(span)) {
        return;
      }
      if (!span.isRecording()) {
        DEBUG_BUILD$2 && debug$2.log("[Profiling] Discarding profile because root span was not sampled.");
        return;
      }
      const spanId = span.spanContext().spanId;
      if (!spanId || this._activeRootSpanIds.has(spanId)) {
        return;
      }
      this._registerTraceRootSpan(spanId);
      const rootSpanCount = this._activeRootSpanIds.size;
      if (rootSpanCount === 1) {
        DEBUG_BUILD$2 && debug$2.log(
          `[Profiling] Root span ${spanId} started. Profiling active while there are active root spans (count=${rootSpanCount}).`
        );
        this._beginProfiling();
      }
    });
    client.on("spanEnd", (span) => {
      if (!this._sessionSampled) {
        return;
      }
      const spanId = span.spanContext().spanId;
      if (!spanId || !this._activeRootSpanIds.has(spanId)) {
        return;
      }
      this._activeRootSpanIds.delete(spanId);
      const rootSpanCount = this._activeRootSpanIds.size;
      DEBUG_BUILD$2 && debug$2.log(
        `[Profiling] Root span with ID ${spanId} ended. Will continue profiling for as long as there are active root spans (currently: ${rootSpanCount}).`
      );
      if (rootSpanCount === 0) {
        this._collectCurrentChunk().catch((e2) => {
          DEBUG_BUILD$2 && debug$2.error("[Profiling] Failed to collect current profile chunk on last `spanEnd`:", e2);
        });
        this._endProfiling();
      }
    });
  }
  /**
   * Resets profiling information from scope and resets running state (used on failure)
   */
  _resetProfilerInfo() {
    this._isRunning = false;
    getGlobalScope().setContext("profile", {});
  }
  /**
   * Clear and reset all per-root-span timeouts.
   */
  _clearAllRootSpanTimeouts() {
    this._rootSpanTimeouts.forEach((timeout) => clearTimeout(timeout));
    this._rootSpanTimeouts.clear();
  }
  /** Keep track of root spans and schedule safeguard timeout (trace mode). */
  _registerTraceRootSpan(spanId) {
    this._activeRootSpanIds.add(spanId);
    const timeout = setTimeout(() => this._onRootSpanTimeout(spanId), MAX_ROOT_SPAN_PROFILE_MS);
    this._rootSpanTimeouts.set(spanId, timeout);
  }
  /**
   * Start a profiler instance if needed.
   */
  _startProfilerInstance() {
    if (this._profiler?.stopped === false) {
      return;
    }
    const profiler = startJSSelfProfile();
    if (!profiler) {
      DEBUG_BUILD$2 && debug$2.log("[Profiling] Failed to start JS Profiler.");
      return;
    }
    this._profiler = profiler;
  }
  /**
   * Schedule the next 60s chunk while running.
   * Each tick collects a chunk and restarts the profiler.
   * A chunk should be closed when there are no active root spans anymore OR when the maximum chunk interval is reached.
   */
  _startPeriodicChunking() {
    if (!this._isRunning) {
      return;
    }
    this._chunkTimer = setTimeout(() => {
      this._collectCurrentChunk().catch((e2) => {
        DEBUG_BUILD$2 && debug$2.error("[Profiling] Failed to collect current profile chunk during periodic chunking:", e2);
      });
      if (this._isRunning) {
        this._startProfilerInstance();
        if (!this._profiler) {
          this._resetProfilerInfo();
          return;
        }
        this._startPeriodicChunking();
      }
    }, CHUNK_INTERVAL_MS);
  }
  /**
   * Handle timeout for a specific root span ID to avoid indefinitely running profiler if `spanEnd` never fires.
   * If this was the last active root span, collect the current chunk and stop profiling.
   */
  _onRootSpanTimeout(rootSpanId) {
    if (!this._rootSpanTimeouts.has(rootSpanId)) {
      return;
    }
    this._rootSpanTimeouts.delete(rootSpanId);
    if (!this._activeRootSpanIds.has(rootSpanId)) {
      return;
    }
    DEBUG_BUILD$2 && debug$2.log(
      `[Profiling] Reached 5-minute timeout for root span ${rootSpanId}. You likely started a manual root span that never called \`.end()\`.`
    );
    this._activeRootSpanIds.delete(rootSpanId);
    if (this._activeRootSpanIds.size === 0) {
      this._endProfiling();
    }
  }
  /**
   * Stop current profiler instance, convert profile to chunk & send.
   */
  async _collectCurrentChunk() {
    const prevProfiler = this._profiler;
    this._profiler = void 0;
    if (!prevProfiler) {
      return;
    }
    try {
      const profile = await prevProfiler.stop();
      const chunk = createProfileChunkPayload(profile, this._client, this._profilerId);
      const validationReturn = validateProfileChunk(chunk);
      if ("reason" in validationReturn) {
        DEBUG_BUILD$2 && debug$2.log(
          "[Profiling] Discarding invalid profile chunk (this is probably a bug in the SDK):",
          validationReturn.reason
        );
        return;
      }
      this._sendProfileChunk(chunk);
      DEBUG_BUILD$2 && debug$2.log("[Profiling] Collected browser profile chunk.");
    } catch (e2) {
      DEBUG_BUILD$2 && debug$2.log("[Profiling] Error while stopping JS Profiler for chunk:", e2);
    }
  }
  /**
   * Send a profile chunk as a standalone envelope.
   */
  _sendProfileChunk(chunk) {
    const client = this._client;
    const sdkInfo = getSdkMetadataForEnvelopeHeader(client.getSdkMetadata?.());
    const dsn = client.getDsn();
    const tunnel = client.getOptions().tunnel;
    const envelope = createEnvelope(
      {
        event_id: uuid4(),
        sent_at: (/* @__PURE__ */ new Date()).toISOString(),
        ...sdkInfo && { sdk: sdkInfo },
        ...!!tunnel && dsn && { dsn: dsnToString(dsn) }
      },
      [[{ type: "profile_chunk", platform: "javascript" }, chunk]]
    );
    client.sendEnvelope(envelope).then(null, (reason) => {
      DEBUG_BUILD$2 && debug$2.error("Error while sending profile chunk envelope:", reason);
    });
  }
}
const INTEGRATION_NAME$2 = "BrowserProfiling";
const _browserProfilingIntegration = (() => {
  return {
    name: INTEGRATION_NAME$2,
    setup(client) {
      const options = client.getOptions();
      const profiler = new UIProfiler();
      if (!hasLegacyProfiling(options) && !options.profileLifecycle) {
        options.profileLifecycle = "manual";
      }
      if (hasLegacyProfiling(options) && !options.profilesSampleRate) {
        DEBUG_BUILD$2 && debug$2.log("[Profiling] Profiling disabled, no profiling options found.");
        return;
      }
      const activeSpan = getActiveSpan();
      const rootSpan = activeSpan && getRootSpan(activeSpan);
      if (hasLegacyProfiling(options) && options.profileSessionSampleRate !== void 0) {
        DEBUG_BUILD$2 && debug$2.warn(
          "[Profiling] Both legacy profiling (`profilesSampleRate`) and UI profiling settings are defined. `profileSessionSampleRate` has no effect when legacy profiling is enabled."
        );
      }
      if (!hasLegacyProfiling(options)) {
        const lifecycleMode = options.profileLifecycle;
        client.on("startUIProfiler", () => profiler.start());
        client.on("stopUIProfiler", () => profiler.stop());
        if (lifecycleMode === "manual") {
          profiler.initialize(client);
        } else if (lifecycleMode === "trace") {
          if (!hasSpansEnabled(options)) {
            DEBUG_BUILD$2 && debug$2.warn(
              "[Profiling] `profileLifecycle` is 'trace' but tracing is disabled. Set a `tracesSampleRate` or `tracesSampler` to enable span tracing."
            );
            return;
          }
          profiler.initialize(client);
          if (rootSpan) {
            profiler.notifyRootSpanActive(rootSpan);
          }
          WINDOW$4.setTimeout(() => {
            const laterActiveSpan = getActiveSpan();
            const laterRootSpan = laterActiveSpan && getRootSpan(laterActiveSpan);
            if (laterRootSpan) {
              profiler.notifyRootSpanActive(laterRootSpan);
            }
          }, 0);
        }
      } else {
        if (rootSpan && isAutomatedPageLoadSpan(rootSpan)) {
          if (shouldProfileSpanLegacy(rootSpan)) {
            startProfileForSpan(rootSpan);
          }
        }
        client.on("spanStart", (span) => {
          const rootSpan2 = getRootSpan(span);
          if (span === rootSpan2) {
            if (shouldProfileSpanLegacy(span)) {
              startProfileForSpan(span);
            }
          } else if (PROFILED_ROOT_SPANS.has(rootSpan2)) {
            setThreadAttributes(span);
          }
        });
        client.on("beforeEnvelope", (envelope) => {
          if (!getActiveProfilesCount()) {
            return;
          }
          const profiledTransactionEvents = findProfiledTransactionsFromEnvelope(envelope);
          if (!profiledTransactionEvents.length) {
            return;
          }
          const profilesToAddToEnvelope = [];
          for (const profiledTransaction of profiledTransactionEvents) {
            const context = profiledTransaction?.contexts;
            const profile_id = context?.profile?.["profile_id"];
            const start_timestamp = context?.profile?.["start_timestamp"];
            if (typeof profile_id !== "string") {
              DEBUG_BUILD$2 && debug$2.log("[Profiling] cannot find profile for a span without a profile context");
              continue;
            }
            if (!profile_id) {
              DEBUG_BUILD$2 && debug$2.log("[Profiling] cannot find profile for a span without a profile context");
              continue;
            }
            if (context?.profile) {
              delete context.profile;
            }
            const profile = takeProfileFromGlobalCache(profile_id);
            if (!profile) {
              DEBUG_BUILD$2 && debug$2.log(`[Profiling] Could not retrieve profile for span: ${profile_id}`);
              continue;
            }
            const profileEvent = createProfilingEvent(
              profile_id,
              start_timestamp,
              profile,
              profiledTransaction
            );
            if (profileEvent) {
              profilesToAddToEnvelope.push(profileEvent);
            }
          }
          addProfilesToEnvelope(envelope, profilesToAddToEnvelope);
        });
      }
    }
  };
});
const browserProfilingIntegration = defineIntegration(_browserProfilingIntegration);
const INTEGRATION_NAME$1 = "SpotlightBrowser";
const SPOTLIGHT_IGNORE_SPANS = [{ op: "ui.interaction.click", name: "#sentry-spotlight" }];
const _spotlightIntegration = ((options = {}) => {
  const sidecarUrl = options.sidecarUrl || "http://localhost:8969/stream";
  return {
    name: INTEGRATION_NAME$1,
    setup: () => {
      DEBUG_BUILD$2 && debug$2.log("Using Sidecar URL", sidecarUrl);
    },
    beforeSetup(client) {
      const opts = client.getOptions();
      opts.ignoreSpans = [...opts.ignoreSpans || [], ...SPOTLIGHT_IGNORE_SPANS];
    },
    afterAllSetup: (client) => {
      setupSidecarForwarding(client, sidecarUrl);
    }
  };
});
function setupSidecarForwarding(client, sidecarUrl) {
  const makeFetch = getNativeImplementation("fetch");
  let failCount = 0;
  client.on("beforeEnvelope", (envelope) => {
    if (failCount > 3) {
      debug$2.warn("[Spotlight] Disabled Sentry -> Spotlight integration due to too many failed requests:", failCount);
      return;
    }
    makeFetch(sidecarUrl, {
      method: "POST",
      body: serializeEnvelope(envelope),
      headers: {
        "Content-Type": "application/x-sentry-envelope"
      },
      mode: "cors"
    }).then(
      (res) => {
        if (res.status >= 200 && res.status < 400) {
          failCount = 0;
        }
      },
      (err) => {
        failCount++;
        debug$2.error(
          "Sentry SDK can't connect to Sidecar is it running? See: https://spotlightjs.com/sidecar/npx/",
          err
        );
      }
    );
  });
}
const spotlightBrowserIntegration = defineIntegration(_spotlightIntegration);
const launchDarklyIntegration = defineIntegration(() => {
  return {
    name: "LaunchDarkly",
    processEvent(event, _hint, _client) {
      return _INTERNAL_copyFlagsFromScopeToEvent(event);
    }
  };
});
function buildLaunchDarklyFlagUsedHandler() {
  return {
    name: "sentry-flag-auditor",
    type: "flag-used",
    synchronous: true,
    /**
     * Handle a flag evaluation by storing its name and value on the current scope.
     */
    method: (flagKey, flagDetail, _context) => {
      _INTERNAL_insertFlagToScope(flagKey, flagDetail.value);
      _INTERNAL_addFeatureFlagToActiveSpan(flagKey, flagDetail.value);
    }
  };
}
const openFeatureIntegration = defineIntegration(() => {
  return {
    name: "OpenFeature",
    processEvent(event, _hint, _client) {
      return _INTERNAL_copyFlagsFromScopeToEvent(event);
    }
  };
});
class OpenFeatureIntegrationHook {
  /**
   * Successful evaluation result.
   */
  after(_hookContext, evaluationDetails) {
    _INTERNAL_insertFlagToScope(evaluationDetails.flagKey, evaluationDetails.value);
    _INTERNAL_addFeatureFlagToActiveSpan(evaluationDetails.flagKey, evaluationDetails.value);
  }
  /**
   * On error evaluation result.
   */
  error(hookContext, _error, _hookHints) {
    _INTERNAL_insertFlagToScope(hookContext.flagKey, hookContext.defaultValue);
    _INTERNAL_addFeatureFlagToActiveSpan(hookContext.flagKey, hookContext.defaultValue);
  }
}
const unleashIntegration = defineIntegration(
  ({ featureFlagClientClass: unleashClientClass }) => {
    return {
      name: "Unleash",
      setupOnce() {
        const unleashClientPrototype = unleashClientClass.prototype;
        fill(unleashClientPrototype, "isEnabled", _wrappedIsEnabled);
      },
      processEvent(event, _hint, _client) {
        return _INTERNAL_copyFlagsFromScopeToEvent(event);
      }
    };
  }
);
function _wrappedIsEnabled(original) {
  return function(...args) {
    const toggleName = args[0];
    const result = original.apply(this, args);
    if (typeof toggleName === "string" && typeof result === "boolean") {
      _INTERNAL_insertFlagToScope(toggleName, result);
      _INTERNAL_addFeatureFlagToActiveSpan(toggleName, result);
    } else if (DEBUG_BUILD$2) {
      debug$2.error(
        `[Feature Flags] UnleashClient.isEnabled does not match expected signature. arg0: ${toggleName} (${typeof toggleName}), result: ${result} (${typeof result})`
      );
    }
    return result;
  };
}
const growthbookIntegration = (({ growthbookClass }) => growthbookIntegration$1({ growthbookClass }));
const statsigIntegration = defineIntegration(
  ({ featureFlagClient: statsigClient }) => {
    return {
      name: "Statsig",
      setup(_client) {
        statsigClient.on("gate_evaluation", (event) => {
          _INTERNAL_insertFlagToScope(event.gate.name, event.gate.value);
          _INTERNAL_addFeatureFlagToActiveSpan(event.gate.name, event.gate.value);
        });
      },
      processEvent(event, _hint, _client) {
        return _INTERNAL_copyFlagsFromScopeToEvent(event);
      }
    };
  }
);
async function diagnoseSdkConnectivity() {
  const client = getClient();
  if (!client) {
    return "no-client-active";
  }
  if (!client.getDsn()) {
    return "no-dsn-configured";
  }
  const tunnel = client.getOptions().tunnel;
  const defaultUrl = "https://o447951.ingest.sentry.io/api/4509632503087104/envelope/?sentry_version=7&sentry_key=c1dfb07d783ad5325c245c1fd3725390&sentry_client=sentry.javascript.browser%2F1.33.7";
  const url = tunnel || defaultUrl;
  try {
    await suppressTracing(
      () => (
        // If fetch throws, there is likely an ad blocker active or there are other connective issues.
        fetch(url, {
          body: "{}",
          method: "POST",
          mode: "cors",
          credentials: "omit"
        })
      )
    );
  } catch {
    return "sentry-unreachable";
  }
}
const INTEGRATION_NAME = "WebWorker";
const webWorkerIntegration = defineIntegration(({ worker }) => ({
  name: INTEGRATION_NAME,
  setupOnce: () => {
    (Array.isArray(worker) ? worker : [worker]).forEach((w2) => listenForSentryMessages(w2));
  },
  addWorker: (worker2) => listenForSentryMessages(worker2)
}));
function listenForSentryMessages(worker) {
  worker.addEventListener("message", (event) => {
    if (isSentryMessage(event.data)) {
      event.stopImmediatePropagation();
      if (event.data._sentryDebugIds) {
        DEBUG_BUILD$2 && debug$2.log("Sentry debugId web worker message received", event.data);
        WINDOW$4._sentryDebugIds = {
          ...event.data._sentryDebugIds,
          // debugIds of the main thread have precedence over the worker's in case of a collision.
          ...WINDOW$4._sentryDebugIds
        };
      }
      if (event.data._sentryModuleMetadata) {
        DEBUG_BUILD$2 && debug$2.log("Sentry module metadata web worker message received", event.data);
        WINDOW$4._sentryModuleMetadata = {
          ...event.data._sentryModuleMetadata,
          // Module metadata of the main thread have precedence over the worker's in case of a collision.
          ...WINDOW$4._sentryModuleMetadata
        };
      }
      if (event.data._sentryWasmImages) {
        DEBUG_BUILD$2 && debug$2.log("Sentry WASM images web worker message received", event.data);
        const existingImages = WINDOW$4._sentryWasmImages || [];
        const newImages = event.data._sentryWasmImages.filter(
          (newImg) => isPlainObject(newImg) && typeof newImg.code_file === "string" && !existingImages.some((existing) => existing.code_file === newImg.code_file)
        );
        WINDOW$4._sentryWasmImages = [
          ...existingImages,
          ...newImages
        ];
      }
      if (event.data._sentryWorkerError) {
        DEBUG_BUILD$2 && debug$2.log("Sentry worker rejection message received", event.data._sentryWorkerError);
        handleForwardedWorkerRejection(event.data._sentryWorkerError);
      }
    }
  });
}
function handleForwardedWorkerRejection(workerError) {
  const client = getClient();
  if (!client) {
    return;
  }
  const stackParser = client.getOptions().stackParser;
  const attachStacktrace = client.getOptions().attachStacktrace;
  const error2 = workerError.reason;
  const event = isPrimitive(error2) ? _eventFromRejectionWithPrimitive(error2) : eventFromUnknownInput(stackParser, error2, void 0, attachStacktrace, true);
  event.level = "error";
  if (workerError.filename) {
    event.contexts = {
      ...event.contexts,
      worker: {
        filename: workerError.filename
      }
    };
  }
  captureEvent(event, {
    originalException: error2,
    mechanism: {
      handled: false,
      type: "auto.browser.web_worker.onunhandledrejection"
    }
  });
  DEBUG_BUILD$2 && debug$2.log("Captured worker unhandled rejection", error2);
}
function registerWebWorker({ self }) {
  self.postMessage({
    _sentryMessage: true,
    _sentryDebugIds: self._sentryDebugIds ?? void 0,
    _sentryModuleMetadata: self._sentryModuleMetadata ?? void 0
  });
  self.addEventListener("unhandledrejection", (event) => {
    const reason = _getUnhandledRejectionError(event);
    const serializedError = {
      reason,
      filename: self.location?.href
    };
    self.postMessage({
      _sentryMessage: true,
      _sentryWorkerError: serializedError
    });
    DEBUG_BUILD$2 && debug$2.log("[Sentry Worker] Forwarding unhandled rejection to parent", serializedError);
  });
  DEBUG_BUILD$2 && debug$2.log("[Sentry Worker] Registered worker with unhandled rejection handling");
}
function isSentryMessage(eventData) {
  if (!isPlainObject(eventData) || eventData._sentryMessage !== true) {
    return false;
  }
  const hasDebugIds = "_sentryDebugIds" in eventData;
  const hasModuleMetadata = "_sentryModuleMetadata" in eventData;
  const hasWorkerError = "_sentryWorkerError" in eventData;
  const hasWasmImages = "_sentryWasmImages" in eventData;
  if (!hasDebugIds && !hasModuleMetadata && !hasWorkerError && !hasWasmImages) {
    return false;
  }
  if (hasDebugIds && !(isPlainObject(eventData._sentryDebugIds) || eventData._sentryDebugIds === void 0)) {
    return false;
  }
  if (hasModuleMetadata && !(isPlainObject(eventData._sentryModuleMetadata) || eventData._sentryModuleMetadata === void 0)) {
    return false;
  }
  if (hasWorkerError && !isPlainObject(eventData._sentryWorkerError)) {
    return false;
  }
  if (hasWasmImages && (!Array.isArray(eventData._sentryWasmImages) || !eventData._sentryWasmImages.every(
    (img) => isPlainObject(img) && typeof img.code_file === "string"
  ))) {
    return false;
  }
  return true;
}
function isSyntheticEvent(wat) {
  return isPlainObject(wat) && "nativeEvent" in wat && "preventDefault" in wat && "stopPropagation" in wat;
}
function init(options) {
  const opts = {
    ...options
  };
  applySdkMetadata(opts, "react");
  setContext("react", { version: reactExports.version });
  const client = init$1(opts);
  setNormalizeStringifier(normalizeStringifyValue);
  return client;
}
function normalizeStringifyValue(value) {
  if (isSyntheticEvent(value)) {
    return "[SyntheticEvent]";
  }
  return normalizeStringifyValue$1(value);
}
function isAtLeastReact17(reactVersion) {
  const reactMajor = reactVersion.match(/^([^.]+)/);
  return reactMajor !== null && parseInt(reactMajor[0]) >= 17;
}
function setCause(error2, cause) {
  const seenErrors = /* @__PURE__ */ new WeakSet();
  function recurse(error22, cause2) {
    if (seenErrors.has(error22)) {
      return;
    }
    if (error22.cause) {
      seenErrors.add(error22);
      return recurse(error22.cause, cause2);
    }
    error22.cause = cause2;
  }
  recurse(error2, cause);
}
function captureReactException(error2, { componentStack }, hint) {
  if (isAtLeastReact17(reactExports.version) && isError(error2) && componentStack) {
    const errorBoundaryError = new Error(error2.message);
    errorBoundaryError.name = `React ErrorBoundary ${error2.name}`;
    errorBoundaryError.stack = componentStack;
    setCause(error2, errorBoundaryError);
  }
  return withScope((scope) => {
    scope.setContext("react", { componentStack });
    return captureException(error2, hint);
  });
}
function reactErrorHandler(callback) {
  return (error2, errorInfo) => {
    const hasCallback = !!callback;
    const eventId = captureReactException(error2, errorInfo, {
      mechanism: { handled: hasCallback, type: "auto.function.react.error_handler" }
    });
    if (hasCallback) {
      callback(error2, errorInfo, eventId);
    }
  };
}
const REACT_RENDER_OP = "ui.react.render";
const REACT_UPDATE_OP = "ui.react.update";
const REACT_MOUNT_OP = "ui.react.mount";
const REACT_STATICS = {
  childContextTypes: true,
  contextType: true,
  contextTypes: true,
  defaultProps: true,
  displayName: true,
  getDefaultProps: true,
  getDerivedStateFromError: true,
  getDerivedStateFromProps: true,
  mixins: true,
  propTypes: true,
  type: true
};
const KNOWN_STATICS = {
  name: true,
  length: true,
  prototype: true,
  caller: true,
  callee: true,
  arguments: true,
  arity: true
};
const FORWARD_REF_STATICS = {
  $$typeof: true,
  render: true,
  defaultProps: true,
  displayName: true,
  propTypes: true
};
const MEMO_STATICS = {
  $$typeof: true,
  compare: true,
  defaultProps: true,
  displayName: true,
  propTypes: true,
  type: true
};
const ForwardRefType = /* @__PURE__ */ Symbol.for("react.forward_ref");
const MemoType = /* @__PURE__ */ Symbol.for("react.memo");
function isMemo(component) {
  return typeof component === "object" && component !== null && component.$$typeof === MemoType;
}
const TYPE_STATICS = {};
TYPE_STATICS[ForwardRefType] = FORWARD_REF_STATICS;
TYPE_STATICS[MemoType] = MEMO_STATICS;
function getStatics(component) {
  if (isMemo(component)) {
    return MEMO_STATICS;
  }
  const componentType = component.$$typeof;
  return componentType && TYPE_STATICS[componentType] || REACT_STATICS;
}
const defineProperty = Object.defineProperty.bind(Object);
const getOwnPropertyNames = Object.getOwnPropertyNames.bind(Object);
const getOwnPropertySymbols = Object.getOwnPropertySymbols?.bind(Object);
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor.bind(Object);
const getPrototypeOf = Object.getPrototypeOf.bind(Object);
const objectPrototype = Object.prototype;
function hoistNonReactStatics(targetComponent, sourceComponent, excludelist) {
  if (typeof sourceComponent !== "string") {
    if (objectPrototype) {
      const inheritedComponent = getPrototypeOf(sourceComponent);
      if (inheritedComponent && inheritedComponent !== objectPrototype) {
        hoistNonReactStatics(targetComponent, inheritedComponent);
      }
    }
    let keys2 = getOwnPropertyNames(sourceComponent);
    if (getOwnPropertySymbols) {
      keys2 = keys2.concat(getOwnPropertySymbols(sourceComponent));
    }
    const targetStatics = getStatics(targetComponent);
    const sourceStatics = getStatics(sourceComponent);
    for (const key of keys2) {
      if (!KNOWN_STATICS[key] && true && !sourceStatics?.[key] && !targetStatics?.[key] && !getOwnPropertyDescriptor(targetComponent, key)) {
        const descriptor = getOwnPropertyDescriptor(sourceComponent, key);
        if (descriptor) {
          try {
            defineProperty(targetComponent, key, descriptor);
          } catch (_e) {
          }
        }
      }
    }
  }
  return targetComponent;
}
const UNKNOWN_COMPONENT$1 = "unknown";
class Profiler extends reactExports.Component {
  constructor(props) {
    super(props);
    const { name, disabled = false } = this.props;
    if (disabled) {
      return;
    }
    this._mountSpan = startInactiveSpan({
      name: `<${name}>`,
      onlyIfParent: true,
      op: REACT_MOUNT_OP,
      attributes: {
        [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ui.react.profiler",
        "ui.component_name": name
      }
    });
  }
  // If a component mounted, we can finish the mount activity.
  componentDidMount() {
    if (this._mountSpan) {
      this._mountSpan.end();
    }
  }
  shouldComponentUpdate({ updateProps, includeUpdates = true }) {
    if (includeUpdates && this._mountSpan && updateProps !== this.props.updateProps) {
      const changedProps = Object.keys(updateProps).filter((k2) => updateProps[k2] !== this.props.updateProps[k2]);
      if (changedProps.length > 0) {
        const now = timestampInSeconds();
        this._updateSpan = withActiveSpan(this._mountSpan, () => {
          return startInactiveSpan({
            name: `<${this.props.name}>`,
            onlyIfParent: true,
            op: REACT_UPDATE_OP,
            startTime: now,
            attributes: {
              [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ui.react.profiler",
              "ui.component_name": this.props.name,
              "ui.react.changed_props": changedProps
            }
          });
        });
      }
    }
    return true;
  }
  componentDidUpdate() {
    if (this._updateSpan) {
      this._updateSpan.end();
      this._updateSpan = void 0;
    }
  }
  // If a component is unmounted, we can say it is no longer on the screen.
  // This means we can finish the span representing the component render.
  componentWillUnmount() {
    const endTimestamp = timestampInSeconds();
    const { name, includeRender = true } = this.props;
    if (this._mountSpan && includeRender) {
      const startTime = spanToJSON(this._mountSpan).timestamp;
      withActiveSpan(this._mountSpan, () => {
        const renderSpan = startInactiveSpan({
          onlyIfParent: true,
          name: `<${name}>`,
          op: REACT_RENDER_OP,
          startTime,
          attributes: {
            [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ui.react.profiler",
            "ui.component_name": name
          }
        });
        if (renderSpan) {
          renderSpan.end(endTimestamp);
        }
      });
    }
  }
  render() {
    return this.props.children;
  }
}
Object.assign(Profiler, {
  defaultProps: {
    disabled: false,
    includeRender: true,
    includeUpdates: true
  }
});
function withProfiler(WrappedComponent, options) {
  const componentDisplayName = options?.name || WrappedComponent.displayName || WrappedComponent.name || UNKNOWN_COMPONENT$1;
  const Wrapped = (props) => /* @__PURE__ */ reactExports.createElement(Profiler, { ...options, name: componentDisplayName, updateProps: props }, /* @__PURE__ */ reactExports.createElement(WrappedComponent, { ...props }));
  Wrapped.displayName = `profiler(${componentDisplayName})`;
  hoistNonReactStatics(Wrapped, WrappedComponent);
  return Wrapped;
}
function useProfiler(name, options = {
  disabled: false,
  hasRenderSpan: true
}) {
  const [mountSpan] = reactExports.useState(() => {
    if (options?.disabled) {
      return void 0;
    }
    return startInactiveSpan({
      name: `<${name}>`,
      onlyIfParent: true,
      op: REACT_MOUNT_OP,
      attributes: {
        [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ui.react.profiler",
        "ui.component_name": name
      }
    });
  });
  reactExports.useEffect(() => {
    if (mountSpan) {
      mountSpan.end();
    }
    return () => {
      if (mountSpan && options.hasRenderSpan) {
        const startTime = spanToJSON(mountSpan).timestamp;
        const endTimestamp = timestampInSeconds();
        const renderSpan = startInactiveSpan({
          name: `<${name}>`,
          onlyIfParent: true,
          op: REACT_RENDER_OP,
          startTime,
          attributes: {
            [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ui.react.profiler",
            "ui.component_name": name
          }
        });
        if (renderSpan) {
          renderSpan.end(endTimestamp);
        }
      }
    };
  }, []);
}
const DEBUG_BUILD = typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__;
const UNKNOWN_COMPONENT = "unknown";
const INITIAL_STATE = {
  componentStack: null,
  error: null,
  eventId: null
};
class ErrorBoundary extends reactExports.Component {
  constructor(props) {
    super(props);
    this.state = INITIAL_STATE;
    this._openFallbackReportDialog = true;
    const client = getClient();
    if (client && props.showDialog) {
      this._openFallbackReportDialog = false;
      this._cleanupHook = client.on("afterSendEvent", (event) => {
        if (!event.type && this._lastEventId && event.event_id === this._lastEventId) {
          showReportDialog({ ...props.dialogOptions, eventId: this._lastEventId });
        }
      });
    }
  }
  componentDidCatch(error2, errorInfo) {
    const { componentStack } = errorInfo;
    const { beforeCapture, onError, showDialog, dialogOptions } = this.props;
    withScope((scope) => {
      if (beforeCapture) {
        beforeCapture(scope, error2, componentStack);
      }
      const handled = this.props.handled != null ? this.props.handled : !!this.props.fallback;
      const eventId = captureReactException(error2, errorInfo, {
        mechanism: { handled, type: "auto.function.react.error_boundary" }
      });
      if (onError) {
        onError(error2, componentStack, eventId);
      }
      if (showDialog) {
        this._lastEventId = eventId;
        if (this._openFallbackReportDialog) {
          showReportDialog({ ...dialogOptions, eventId });
        }
      }
      this.setState({ error: error2, componentStack, eventId });
    });
  }
  componentDidMount() {
    const { onMount } = this.props;
    if (onMount) {
      onMount();
    }
  }
  componentWillUnmount() {
    const { error: error2, componentStack, eventId } = this.state;
    const { onUnmount } = this.props;
    if (onUnmount) {
      if (this.state === INITIAL_STATE) {
        onUnmount(null, null, null);
      } else {
        onUnmount(error2, componentStack, eventId);
      }
    }
    if (this._cleanupHook) {
      this._cleanupHook();
      this._cleanupHook = void 0;
    }
  }
  resetErrorBoundary() {
    const { onReset } = this.props;
    const { error: error2, componentStack, eventId } = this.state;
    if (onReset) {
      onReset(error2, componentStack, eventId);
    }
    this.setState(INITIAL_STATE);
  }
  render() {
    const { fallback, children } = this.props;
    const state = this.state;
    if (state.componentStack === null) {
      return typeof children === "function" ? children() : children;
    }
    const element = typeof fallback === "function" ? reactExports.createElement(fallback, {
      error: state.error,
      componentStack: state.componentStack,
      resetError: () => this.resetErrorBoundary(),
      eventId: state.eventId
    }) : fallback;
    if (reactExports.isValidElement(element)) {
      return element;
    }
    if (fallback) {
      DEBUG_BUILD && debug$2.warn("fallback did not produce a valid ReactElement");
    }
    return null;
  }
}
function withErrorBoundary(WrappedComponent, errorBoundaryOptions) {
  const componentDisplayName = WrappedComponent.displayName || WrappedComponent.name || UNKNOWN_COMPONENT;
  const Wrapped = reactExports.memo((props) => /* @__PURE__ */ reactExports.createElement(ErrorBoundary, { ...errorBoundaryOptions }, /* @__PURE__ */ reactExports.createElement(WrappedComponent, { ...props })));
  Wrapped.displayName = `errorBoundary(${componentDisplayName})`;
  hoistNonReactStatics(Wrapped, WrappedComponent);
  return Wrapped;
}
const ACTION_BREADCRUMB_CATEGORY = "redux.action";
const ACTION_BREADCRUMB_TYPE = "info";
const defaultOptions = {
  attachReduxState: true,
  actionTransformer: (action) => action,
  stateTransformer: (state) => state || null
};
function createReduxEnhancer(enhancerOptions) {
  const options = {
    ...defaultOptions,
    ...enhancerOptions
  };
  return (next) => (reducer, initialState) => {
    options.attachReduxState && getGlobalScope().addEventProcessor((event, hint) => {
      try {
        if (event.type === void 0 && event.contexts.state.state.type === "redux") {
          hint.attachments = [
            ...hint.attachments || [],
            // @ts-expect-error try catch to reduce bundle size
            { filename: "redux_state.json", data: JSON.stringify(event.contexts.state.state.value) }
          ];
        }
      } catch {
      }
      return event;
    });
    function sentryWrapReducer(reducer2) {
      return (state, action) => {
        const newState = reducer2(state, action);
        const scope = getCurrentScope();
        const transformedAction = options.actionTransformer(action);
        if (typeof transformedAction !== "undefined" && transformedAction !== null) {
          addBreadcrumb({
            category: ACTION_BREADCRUMB_CATEGORY,
            data: transformedAction,
            type: ACTION_BREADCRUMB_TYPE
          });
        }
        const transformedState = options.stateTransformer(newState);
        if (typeof transformedState !== "undefined" && transformedState !== null) {
          const client = getClient();
          const options2 = client?.getOptions();
          const normalizationDepth = options2?.normalizeDepth || 3;
          const newStateContext = { state: { type: "redux", value: transformedState } };
          setNormalizationDepthOverrideHint(
            newStateContext,
            3 + // 3 layers for `state.value.transformedState`
            normalizationDepth
            // rest for the actual state
          );
          scope.setContext("state", newStateContext);
        } else {
          scope.setContext("state", null);
        }
        const { configureScopeWithState } = options;
        if (typeof configureScopeWithState === "function") {
          configureScopeWithState(scope, newState);
        }
        return newState;
      };
    }
    const store = next(sentryWrapReducer(reducer), initialState);
    store.replaceReducer = new Proxy(store.replaceReducer, {
      apply: function(target, thisArg, args) {
        target.apply(thisArg, [sentryWrapReducer(args[0])]);
      }
    });
    return store;
  };
}
function reactRouterV3BrowserTracingIntegration(options) {
  const integration = browserTracingIntegration({
    ...options,
    instrumentPageLoad: false,
    instrumentNavigation: false
  });
  const { history, routes, match, instrumentPageLoad = true, instrumentNavigation = true } = options;
  return {
    ...integration,
    afterAllSetup(client) {
      integration.afterAllSetup(client);
      if (instrumentPageLoad && WINDOW$4.location) {
        normalizeTransactionName(
          routes,
          WINDOW$4.location,
          match,
          (localName, source = "url") => {
            startBrowserTracingPageLoadSpan(client, {
              name: localName,
              attributes: {
                [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "pageload",
                [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.pageload.react.reactrouter_v3",
                [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: source
              }
            });
          }
        );
      }
      if (instrumentNavigation && history.listen) {
        history.listen((location) => {
          if (location.action === "PUSH" || location.action === "POP") {
            normalizeTransactionName(
              routes,
              location,
              match,
              (localName, source = "url") => {
                startBrowserTracingNavigationSpan(client, {
                  name: localName,
                  attributes: {
                    [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "navigation",
                    [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.navigation.react.reactrouter_v3",
                    [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: source
                  }
                });
              }
            );
          }
        });
      }
    }
  };
}
function normalizeTransactionName(appRoutes, location, match, callback) {
  let name = location.pathname;
  match(
    {
      location,
      routes: appRoutes
    },
    (error2, _redirectLocation, renderProps) => {
      if (error2 || !renderProps) {
        return callback(name);
      }
      const routePath = getRouteStringFromRoutes(renderProps.routes || []);
      if (routePath.length === 0 || routePath === "/*") {
        return callback(name);
      }
      name = routePath;
      return callback(name, "route");
    }
  );
}
function getRouteStringFromRoutes(routes) {
  if (!Array.isArray(routes) || routes.length === 0) {
    return "";
  }
  const routesWithPaths = routes.filter((route) => !!route.path);
  let index = -1;
  for (let x2 = routesWithPaths.length - 1; x2 >= 0; x2--) {
    const route = routesWithPaths[x2];
    if (route.path?.startsWith("/")) {
      index = x2;
      break;
    }
  }
  return routesWithPaths.slice(index).reduce((acc, { path }) => {
    const pathSegment = acc === "/" || acc === "" ? path : `/${path}`;
    return `${acc}${pathSegment}`;
  }, "");
}
function tanstackRouterBrowserTracingIntegration(router, options = {}) {
  const castRouterInstance = router;
  const browserTracingIntegrationInstance = browserTracingIntegration({
    ...options,
    instrumentNavigation: false,
    instrumentPageLoad: false
  });
  const { instrumentPageLoad = true, instrumentNavigation = true } = options;
  return {
    ...browserTracingIntegrationInstance,
    afterAllSetup(client) {
      browserTracingIntegrationInstance.afterAllSetup(client);
      const initialWindowLocation = WINDOW$4.location;
      if (instrumentPageLoad && initialWindowLocation) {
        const matchedRoutes = castRouterInstance.matchRoutes(
          initialWindowLocation.pathname,
          castRouterInstance.options.parseSearch(initialWindowLocation.search),
          { preload: false, throwOnError: false }
        );
        const lastMatch = matchedRoutes[matchedRoutes.length - 1];
        const routeMatch = lastMatch?.routeId !== "__root__" ? lastMatch : void 0;
        startBrowserTracingPageLoadSpan(client, {
          name: routeMatch ? routeMatch.routeId : initialWindowLocation.pathname,
          attributes: {
            [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "pageload",
            [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.pageload.react.tanstack_router",
            [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: routeMatch ? "route" : "url",
            ...routeMatchToParamSpanAttributes(routeMatch)
          }
        });
      }
      if (instrumentNavigation) {
        castRouterInstance.subscribe("onBeforeNavigate", (onBeforeNavigateArgs) => {
          if (!onBeforeNavigateArgs.fromLocation || onBeforeNavigateArgs.toLocation.state === onBeforeNavigateArgs.fromLocation.state) {
            return;
          }
          const matchedRoutesOnBeforeNavigate = castRouterInstance.matchRoutes(
            onBeforeNavigateArgs.toLocation.pathname,
            onBeforeNavigateArgs.toLocation.search,
            { preload: false, throwOnError: false }
          );
          const onBeforeNavigateLastMatch = matchedRoutesOnBeforeNavigate[matchedRoutesOnBeforeNavigate.length - 1];
          const onBeforeNavigateRouteMatch = onBeforeNavigateLastMatch?.routeId !== "__root__" ? onBeforeNavigateLastMatch : void 0;
          const navigationLocation = WINDOW$4.location;
          const navigationSpan = startBrowserTracingNavigationSpan(client, {
            name: onBeforeNavigateRouteMatch ? onBeforeNavigateRouteMatch.routeId : navigationLocation.pathname,
            attributes: {
              [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "navigation",
              [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.navigation.react.tanstack_router",
              [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: onBeforeNavigateRouteMatch ? "route" : "url"
            }
          });
          const unsubscribeOnResolved = castRouterInstance.subscribe("onResolved", (onResolvedArgs) => {
            unsubscribeOnResolved();
            if (navigationSpan) {
              const matchedRoutesOnResolved = castRouterInstance.matchRoutes(
                onResolvedArgs.toLocation.pathname,
                onResolvedArgs.toLocation.search,
                { preload: false, throwOnError: false }
              );
              const onResolvedLastMatch = matchedRoutesOnResolved[matchedRoutesOnResolved.length - 1];
              const onResolvedRouteMatch = onResolvedLastMatch?.routeId !== "__root__" ? onResolvedLastMatch : void 0;
              if (onResolvedRouteMatch) {
                navigationSpan.updateName(onResolvedRouteMatch.routeId);
                navigationSpan.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_SOURCE, "route");
                navigationSpan.setAttributes(routeMatchToParamSpanAttributes(onResolvedRouteMatch));
              }
            }
          });
        });
      }
    }
  };
}
function routeMatchToParamSpanAttributes(match) {
  if (!match) {
    return {};
  }
  const paramAttributes = {};
  Object.entries(match.params).forEach(([key, value]) => {
    paramAttributes[`url.path.params.${key}`] = value;
    paramAttributes[`url.path.parameter.${key}`] = value;
    paramAttributes[`params.${key}`] = value;
  });
  return paramAttributes;
}
function reactRouterV4BrowserTracingIntegration(options) {
  const integration = browserTracingIntegration({
    ...options,
    instrumentPageLoad: false,
    instrumentNavigation: false
  });
  const { history, routes, matchPath, instrumentPageLoad = true, instrumentNavigation = true } = options;
  return {
    ...integration,
    afterAllSetup(client) {
      integration.afterAllSetup(client);
      instrumentReactRouter(
        client,
        instrumentPageLoad,
        instrumentNavigation,
        history,
        "reactrouter_v4",
        routes,
        matchPath
      );
    }
  };
}
function reactRouterV5BrowserTracingIntegration(options) {
  const integration = browserTracingIntegration({
    ...options,
    instrumentPageLoad: false,
    instrumentNavigation: false
  });
  const { history, routes, matchPath, instrumentPageLoad = true, instrumentNavigation = true } = options;
  return {
    ...integration,
    afterAllSetup(client) {
      integration.afterAllSetup(client);
      instrumentReactRouter(
        client,
        instrumentPageLoad,
        instrumentNavigation,
        history,
        "reactrouter_v5",
        routes,
        matchPath
      );
    }
  };
}
function instrumentReactRouter(client, instrumentPageLoad, instrumentNavigation, history, instrumentationName, allRoutes2 = [], matchPath) {
  function getInitPathName() {
    if (history.location) {
      return history.location.pathname;
    }
    if (WINDOW$4.location) {
      return WINDOW$4.location.pathname;
    }
    return void 0;
  }
  function normalizeTransactionName2(pathname) {
    if (allRoutes2.length === 0 || !matchPath) {
      return [pathname, "url"];
    }
    const branches = matchRoutes(allRoutes2, pathname, matchPath);
    for (const branch of branches) {
      if (branch.match.isExact) {
        return [branch.match.path, "route"];
      }
    }
    return [pathname, "url"];
  }
  if (instrumentPageLoad) {
    const initPathName = getInitPathName();
    if (initPathName) {
      const [name, source] = normalizeTransactionName2(initPathName);
      startBrowserTracingPageLoadSpan(client, {
        name,
        attributes: {
          [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "pageload",
          [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: `auto.pageload.react.${instrumentationName}`,
          [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: source
        }
      });
    }
  }
  if (instrumentNavigation && history.listen) {
    history.listen((location, action) => {
      if (action && (action === "PUSH" || action === "POP")) {
        const [name, source] = normalizeTransactionName2(location.pathname);
        startBrowserTracingNavigationSpan(client, {
          name,
          attributes: {
            [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "navigation",
            [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: `auto.navigation.react.${instrumentationName}`,
            [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: source
          }
        });
      }
    });
  }
}
function matchRoutes(routes, pathname, matchPath, branch = []) {
  routes.some((route) => {
    const match = route.path ? matchPath(pathname, route) : branch.length ? (
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      branch[branch.length - 1].match
    ) : computeRootMatch(pathname);
    if (match) {
      branch.push({ route, match });
      if (route.routes) {
        matchRoutes(route.routes, pathname, matchPath, branch);
      }
    }
    return !!match;
  });
  return branch;
}
function computeRootMatch(pathname) {
  return { path: "/", url: "/", params: {}, isExact: pathname === "/" };
}
function withSentryRouting(Route) {
  const componentDisplayName = Route.displayName || Route.name;
  const WrappedRoute = (props) => {
    if (props?.computedMatch?.isExact) {
      const route = props.computedMatch.path;
      const activeRootSpan = getActiveRootSpan$1();
      getCurrentScope().setTransactionName(route);
      if (activeRootSpan) {
        activeRootSpan.updateName(route);
        activeRootSpan.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_SOURCE, "route");
      }
    }
    return /* @__PURE__ */ reactExports.createElement(Route, { ...props });
  };
  WrappedRoute.displayName = `sentryRoute(${componentDisplayName})`;
  hoistNonReactStatics(WrappedRoute, Route);
  return WrappedRoute;
}
function getActiveRootSpan$1() {
  const span = getActiveSpan();
  const rootSpan = span && getRootSpan(span);
  if (!rootSpan) {
    return void 0;
  }
  const op = spanToJSON(rootSpan).op;
  return op === "navigation" || op === "pageload" ? rootSpan : void 0;
}
function stripBasenameFromPathname(pathname, basename2) {
  if (!basename2 || basename2 === "/") {
    return pathname;
  }
  if (!pathname.toLowerCase().startsWith(basename2.toLowerCase())) {
    return pathname;
  }
  const startIndex = basename2.endsWith("/") ? basename2.length - 1 : basename2.length;
  const nextChar = pathname.charAt(startIndex);
  if (nextChar && nextChar !== "/") {
    return pathname;
  }
  return pathname.slice(startIndex) || "/";
}
const SORTED_MANIFEST_CACHE = /* @__PURE__ */ new WeakMap();
function matchRouteManifest(pathname, manifest, basename2) {
  if (!pathname || !manifest?.length) {
    return null;
  }
  const normalizedPathname = basename2 ? stripBasenameFromPathname(pathname, basename2) : pathname;
  let sorted = SORTED_MANIFEST_CACHE.get(manifest);
  if (!sorted) {
    sorted = sortBySpecificity(manifest);
    SORTED_MANIFEST_CACHE.set(manifest, sorted);
    DEBUG_BUILD && debug$2.log("[React Router] Sorted route manifest by specificity:", sorted.length, "patterns");
  }
  for (const pattern of sorted) {
    if (matchesPattern(normalizedPathname, pattern)) {
      DEBUG_BUILD && debug$2.log("[React Router] Matched pathname", normalizedPathname, "to pattern", pattern);
      return pattern;
    }
  }
  DEBUG_BUILD && debug$2.log("[React Router] No manifest match found for pathname:", normalizedPathname);
  return null;
}
function matchesPattern(pathname, pattern) {
  if (pattern === "/") {
    return pathname === "/" || pathname === "";
  }
  const pathSegments = splitPath(pathname);
  const patternSegments = splitPath(pattern);
  const hasWildcard = patternSegments.length > 0 && patternSegments[patternSegments.length - 1] === "*";
  if (hasWildcard) {
    const patternSegmentsWithoutWildcard = patternSegments.slice(0, -1);
    if (pathSegments.length < patternSegmentsWithoutWildcard.length) {
      return false;
    }
    for (const [i, patternSegment] of patternSegmentsWithoutWildcard.entries()) {
      if (!segmentMatches(pathSegments[i], patternSegment)) {
        return false;
      }
    }
    return true;
  }
  if (pathSegments.length !== patternSegments.length) {
    return false;
  }
  for (const [i, patternSegment] of patternSegments.entries()) {
    if (!segmentMatches(pathSegments[i], patternSegment)) {
      return false;
    }
  }
  return true;
}
function segmentMatches(pathSegment, patternSegment) {
  if (pathSegment === void 0 || patternSegment === void 0) {
    return false;
  }
  if (PARAM_RE.test(patternSegment)) {
    return true;
  }
  return pathSegment === patternSegment;
}
function splitPath(path) {
  return path.split("/").filter(Boolean);
}
const PARAM_RE = /^:[\w-]+$/;
const STATIC_SEGMENT_SCORE = 10;
const DYNAMIC_SEGMENT_SCORE = 3;
const EMPTY_SEGMENT_SCORE = 1;
const SPLAT_PENALTY = -2;
function computeScore(pattern) {
  const segments = pattern.split("/");
  let score = segments.length;
  if (segments.includes("*")) {
    score += SPLAT_PENALTY;
  }
  for (const segment of segments) {
    if (segment === "*") {
      continue;
    } else if (PARAM_RE.test(segment)) {
      score += DYNAMIC_SEGMENT_SCORE;
    } else if (segment === "") {
      score += EMPTY_SEGMENT_SCORE;
    } else {
      score += STATIC_SEGMENT_SCORE;
    }
  }
  return score;
}
function sortBySpecificity(manifest) {
  return [...manifest].sort((a2, b2) => {
    const aScore = computeScore(a2);
    const bScore = computeScore(b2);
    return bScore - aScore;
  });
}
let _matchRoutes$1;
let _stripBasename = false;
const _navigationContextStack = [];
const MAX_CONTEXT_STACK_SIZE = 10;
function setNavigationContext(targetPath, span) {
  const token = {};
  if (_navigationContextStack.length >= MAX_CONTEXT_STACK_SIZE) {
    DEBUG_BUILD && debug$2.warn("[React Router] Navigation context stack overflow - removing oldest context");
    _navigationContextStack.shift();
  }
  _navigationContextStack.push({ token, targetPath, span });
  return token;
}
function clearNavigationContext(token) {
  const top = _navigationContextStack[_navigationContextStack.length - 1];
  if (top?.token === token) {
    _navigationContextStack.pop();
  }
}
function getNavigationContext() {
  const length = _navigationContextStack.length;
  return length > 0 ? _navigationContextStack[length - 1] ?? null : null;
}
function initializeRouterUtils(matchRoutes2, stripBasename = false) {
  _matchRoutes$1 = matchRoutes2;
  _stripBasename = stripBasename;
}
function pickPath(match) {
  return trimWildcard(match.route.path || "");
}
function pickSplat(match) {
  return match.params["*"] || "";
}
function trimWildcard(path) {
  return path[path.length - 1] === "*" ? path.slice(0, -1) : path;
}
function trimSlash(path) {
  return path[path.length - 1] === "/" ? path.slice(0, -1) : path;
}
function pathEndsWithWildcard(path) {
  return path.endsWith("*");
}
function transactionNameHasWildcard(name) {
  return name.includes("/*") || name.endsWith("*");
}
function pathIsWildcardAndHasChildren(path, branch) {
  return pathEndsWithWildcard(path) && !!branch.route.children?.length || false;
}
function routeIsDescendant(route) {
  return !!(!route.children && route.element && route.path?.endsWith("/*"));
}
function sendIndexPath(pathBuilder, pathname, basename2) {
  const reconstructedPath = pathBuilder && pathBuilder.length > 0 ? pathBuilder : _stripBasename ? stripBasenameFromPathname(pathname, basename2) : pathname;
  let formattedPath = (
    // If the path ends with a wildcard suffix, remove both the slash and the asterisk
    reconstructedPath.slice(-2) === "/*" ? reconstructedPath.slice(0, -2) : reconstructedPath
  );
  if (formattedPath.length > 1 && formattedPath[formattedPath.length - 1] === "/") {
    formattedPath = formattedPath.slice(0, -1);
  }
  return [formattedPath, "route"];
}
function getNumberOfUrlSegments(url) {
  return url.split(/\\?\//).filter((s2) => s2.length > 0 && s2 !== ",").length;
}
function prefixWithSlash(path) {
  return path[0] === "/" ? path : `/${path}`;
}
function rebuildRoutePathFromAllRoutes(allRoutes2, location) {
  const matchedRoutes = _matchRoutes$1(allRoutes2, location);
  if (!matchedRoutes || matchedRoutes.length === 0) {
    return "";
  }
  for (const match of matchedRoutes) {
    if (match.route.path && match.route.path !== "*") {
      const path = pickPath(match);
      const strippedPath = stripBasenameFromPathname(location.pathname, prefixWithSlash(match.pathnameBase));
      if (location.pathname === strippedPath) {
        return trimSlash(strippedPath);
      }
      return trimSlash(
        trimSlash(path || "") + prefixWithSlash(
          rebuildRoutePathFromAllRoutes(
            allRoutes2.filter((route) => route !== match.route),
            {
              pathname: strippedPath
            }
          )
        )
      );
    }
  }
  return "";
}
function locationIsInsideDescendantRoute(location, routes) {
  const matchedRoutes = _matchRoutes$1(routes, location);
  if (matchedRoutes) {
    for (const match of matchedRoutes) {
      if (routeIsDescendant(match.route) && pickSplat(match)) {
        return true;
      }
    }
  }
  return false;
}
function getFallbackTransactionName(location, basename2) {
  return _stripBasename ? stripBasenameFromPathname(location.pathname, basename2) : location.pathname || "";
}
function getNormalizedName(routes, location, branches, basename2 = "") {
  if (!routes || routes.length === 0) {
    return [_stripBasename ? stripBasenameFromPathname(location.pathname, basename2) : location.pathname, "url"];
  }
  if (!branches) {
    return [getFallbackTransactionName(location, basename2), "url"];
  }
  let pathBuilder = "";
  for (const branch of branches) {
    const route = branch.route;
    if (!route) {
      continue;
    }
    if (route.index) {
      return sendIndexPath(pathBuilder, branch.pathname, basename2);
    }
    const path = route.path;
    if (!path || pathIsWildcardAndHasChildren(path, branch)) {
      continue;
    }
    const newPath = path[0] === "/" || pathBuilder[pathBuilder.length - 1] === "/" ? path : `/${path}`;
    pathBuilder = trimSlash(pathBuilder) + prefixWithSlash(newPath);
    if (trimSlash(location.pathname) !== trimSlash(basename2 + branch.pathname)) {
      continue;
    }
    if (getNumberOfUrlSegments(pathBuilder) !== getNumberOfUrlSegments(branch.pathname) && !pathEndsWithWildcard(pathBuilder)) {
      return [(_stripBasename ? "" : basename2) + newPath, "route"];
    }
    if (pathIsWildcardAndHasChildren(pathBuilder, branch)) {
      pathBuilder = pathBuilder.slice(0, -1);
    }
    return [(_stripBasename ? "" : basename2) + pathBuilder, "route"];
  }
  return [getFallbackTransactionName(location, basename2), "url"];
}
function resolveRouteNameAndSource(location, routes, allRoutes2, branches, basename2 = "", lazyRouteManifest, enableAsyncRouteHandlers) {
  if (enableAsyncRouteHandlers && lazyRouteManifest && lazyRouteManifest.length > 0) {
    const manifestMatch = matchRouteManifest(location.pathname, lazyRouteManifest, basename2);
    if (manifestMatch) {
      return [(_stripBasename ? "" : basename2) + manifestMatch, "route"];
    }
  }
  let name;
  let source = "url";
  const isInDescendantRoute = locationIsInsideDescendantRoute(location, allRoutes2);
  if (isInDescendantRoute) {
    name = prefixWithSlash(rebuildRoutePathFromAllRoutes(allRoutes2, location));
    source = "route";
  }
  if (!isInDescendantRoute || !name) {
    [name, source] = getNormalizedName(routes, location, branches, basename2);
  }
  return [name || location.pathname, source];
}
function getActiveRootSpan() {
  const span = getActiveSpan();
  const rootSpan = span ? getRootSpan(span) : void 0;
  if (!rootSpan) {
    return void 0;
  }
  const op = spanToJSON(rootSpan).op;
  return op === "navigation" || op === "pageload" ? rootSpan : void 0;
}
function captureCurrentLocation() {
  const navContext = getNavigationContext();
  if (navContext) {
    if (navContext.targetPath) {
      return {
        pathname: navContext.targetPath,
        search: "",
        hash: "",
        state: null,
        key: "default"
      };
    }
    return null;
  }
  if (typeof WINDOW$4 !== "undefined") {
    try {
      const windowLocation = WINDOW$4.location;
      if (windowLocation) {
        return {
          pathname: windowLocation.pathname,
          search: windowLocation.search || "",
          hash: windowLocation.hash || "",
          state: null,
          key: "default"
        };
      }
    } catch {
      DEBUG_BUILD && debug$2.warn("[React Router] Could not access window.location");
    }
  }
  return null;
}
function captureActiveSpan() {
  const navContext = getNavigationContext();
  if (navContext) {
    return navContext.span;
  }
  return getActiveRootSpan();
}
function createAsyncHandlerProxy(originalFunction, route, handlerKey, processResolvedRoutes2) {
  const proxy = new Proxy(originalFunction, {
    apply(target, thisArg, argArray) {
      const locationAtInvocation = captureCurrentLocation();
      const spanAtInvocation = captureActiveSpan();
      const result = target.apply(thisArg, argArray);
      handleAsyncHandlerResult(
        result,
        route,
        handlerKey,
        processResolvedRoutes2,
        locationAtInvocation,
        spanAtInvocation
      );
      return result;
    }
  });
  addNonEnumerableProperty(proxy, "__sentry_proxied__", true);
  return proxy;
}
function handleAsyncHandlerResult(result, route, handlerKey, processResolvedRoutes2, currentLocation, capturedSpan) {
  if (isThenable(result)) {
    result.then((resolvedRoutes) => {
      if (Array.isArray(resolvedRoutes)) {
        processResolvedRoutes2(resolvedRoutes, route, currentLocation ?? void 0, capturedSpan);
      }
    }).catch((e2) => {
      DEBUG_BUILD && debug$2.warn(`Error resolving async handler '${handlerKey}' for route`, route, e2);
    });
  } else if (Array.isArray(result)) {
    processResolvedRoutes2(result, route, currentLocation ?? void 0, capturedSpan);
  }
}
function checkRouteForAsyncHandler(route, processResolvedRoutes2) {
  if (route.handle && typeof route.handle === "object") {
    for (const key of Object.keys(route.handle)) {
      const maybeFn = route.handle[key];
      if (typeof maybeFn === "function" && !maybeFn.__sentry_proxied__) {
        route.handle[key] = createAsyncHandlerProxy(maybeFn, route, key, processResolvedRoutes2);
      }
    }
  }
  if (Array.isArray(route.children)) {
    for (const child of route.children) {
      checkRouteForAsyncHandler(child, processResolvedRoutes2);
    }
  }
}
let _useEffect;
let _useLocation;
let _useNavigationType;
let _createRoutesFromChildren;
let _matchRoutes;
let _enableAsyncRouteHandlers = false;
let _lazyRouteTimeout = 3e3;
let _lazyRouteManifest;
let _basename = "";
const CLIENTS_WITH_INSTRUMENT_NAVIGATION = /* @__PURE__ */ new WeakSet();
const activeNavigationSpans = /* @__PURE__ */ new WeakMap();
const allRoutes = /* @__PURE__ */ new Set();
const pendingLazyRouteLoads = /* @__PURE__ */ new WeakMap();
const deferredLazyRouteResolvers = /* @__PURE__ */ new WeakMap();
function scheduleCallback(callback) {
  if (WINDOW$4?.requestAnimationFrame) {
    return WINDOW$4.requestAnimationFrame(callback);
  }
  return setTimeout(callback, 0);
}
function cancelScheduledCallback(id) {
  if (WINDOW$4?.cancelAnimationFrame) {
    WINDOW$4.cancelAnimationFrame(id);
  } else {
    clearTimeout(id);
  }
}
function computeLocationKey(location) {
  return `${location.pathname}${location.search || ""}${location.hash || ""}`;
}
function isParameterizedRoute(routeName) {
  return routeName.includes(":") || routeName.includes("*");
}
function shouldSkipNavigation(trackedNav, locationKey, proposedName, spanHasEnded) {
  if (!trackedNav) {
    return { skip: false, shouldUpdate: false };
  }
  const isDuplicate = trackedNav.locationKey === locationKey && (trackedNav.isPlaceholder || !spanHasEnded);
  if (isDuplicate) {
    const currentHasWildcard = !!trackedNav.routeName && transactionNameHasWildcard(trackedNav.routeName);
    const proposedHasWildcard = transactionNameHasWildcard(proposedName);
    const currentIsParameterized = !!trackedNav.routeName && isParameterizedRoute(trackedNav.routeName);
    const proposedIsParameterized = isParameterizedRoute(proposedName);
    const isWildcardUpgrade = currentHasWildcard && !proposedHasWildcard;
    const isRawToParameterized = !currentIsParameterized && proposedIsParameterized;
    const isMoreSpecific = proposedName !== trackedNav.routeName && proposedName.length > (trackedNav.routeName?.length || 0) && !proposedHasWildcard;
    const shouldUpdate = !!(trackedNav.routeName && (isWildcardUpgrade || isRawToParameterized || isMoreSpecific));
    return { skip: true, shouldUpdate };
  }
  return { skip: false, shouldUpdate: false };
}
function addResolvedRoutesToParent(resolvedRoutes, parentRoute) {
  const existingChildren = parentRoute.children || [];
  const newRoutes = resolvedRoutes.filter(
    (newRoute) => !existingChildren.some(
      (existing) => existing === newRoute || newRoute.path && existing.path === newRoute.path || newRoute.id && existing.id === newRoute.id
    )
  );
  if (newRoutes.length > 0) {
    parentRoute.children = [...existingChildren, ...newRoutes];
  }
}
function trackLazyRouteLoad(span, promise) {
  let promises = pendingLazyRouteLoads.get(span);
  if (!promises) {
    promises = /* @__PURE__ */ new Set();
    pendingLazyRouteLoads.set(span, promises);
  }
  promises.add(promise);
  promise.finally(() => {
    const currentPromises = pendingLazyRouteLoads.get(span);
    if (currentPromises) {
      currentPromises.delete(promise);
    }
  });
}
function createDeferredLazyRoutePromise(span) {
  const deferredPromise = new Promise((resolve) => {
    deferredLazyRouteResolvers.set(span, resolve);
  });
  trackLazyRouteLoad(span, deferredPromise);
}
function resolveDeferredLazyRoutePromise(span) {
  const resolver = deferredLazyRouteResolvers.get(span);
  if (resolver) {
    resolver();
    deferredLazyRouteResolvers.delete(span);
    if (span.__sentry_may_have_lazy_routes__) {
      span.__sentry_may_have_lazy_routes__ = false;
    }
  }
}
function processResolvedRoutes(resolvedRoutes, parentRoute, currentLocation = null, capturedSpan) {
  resolvedRoutes.forEach((child) => {
    allRoutes.add(child);
    if (_enableAsyncRouteHandlers) {
      checkRouteForAsyncHandler(child, processResolvedRoutes);
    }
  });
  if (parentRoute) {
    addResolvedRoutesToParent(resolvedRoutes, parentRoute);
  }
  const targetSpan = capturedSpan ?? getActiveRootSpan();
  if (targetSpan) {
    const spanJson = spanToJSON(targetSpan);
    if (spanJson.timestamp) {
      DEBUG_BUILD && debug$2.warn("[React Router] Lazy handler resolved after span ended - skipping update");
      return;
    }
    const spanOp = spanJson.op;
    let location = currentLocation;
    if (!location && !capturedSpan) {
      if (typeof WINDOW$4 !== "undefined") {
        const globalLocation = WINDOW$4.location;
        if (globalLocation?.pathname) {
          location = { pathname: globalLocation.pathname };
        }
      }
    }
    if (location) {
      if (spanOp === "pageload") {
        updatePageloadTransaction({
          activeRootSpan: targetSpan,
          location: { pathname: location.pathname },
          routes: Array.from(allRoutes),
          allRoutes: Array.from(allRoutes)
        });
      } else if (spanOp === "navigation") {
        updateNavigationSpan(targetSpan, location, Array.from(allRoutes), false, _matchRoutes);
      }
    }
  }
}
function updateNavigationSpan(activeRootSpan, location, allRoutes2, forceUpdate = false, matchRoutes2) {
  const spanJson = spanToJSON(activeRootSpan);
  const currentName = spanJson.description;
  const hasBeenNamed = activeRootSpan?.__sentry_navigation_name_set__;
  const currentNameHasWildcard = currentName && transactionNameHasWildcard(currentName);
  const shouldUpdate = !hasBeenNamed || forceUpdate || currentNameHasWildcard;
  if (shouldUpdate && !spanJson.timestamp) {
    const currentBranches = matchRoutes2(allRoutes2, location);
    const [name, source] = resolveRouteNameAndSource(
      location,
      allRoutes2,
      allRoutes2,
      currentBranches || [],
      _basename,
      _lazyRouteManifest,
      _enableAsyncRouteHandlers
    );
    const currentSource = spanJson.data?.[SEMANTIC_ATTRIBUTE_SENTRY_SOURCE];
    const isImprovement = name && (!currentName || // No current name - always set
    !hasBeenNamed && (currentSource !== "route" || source === "route") || // Not finalized - allow unless downgrading route→url
    currentSource !== "route" && source === "route" || // URL → route upgrade
    currentSource === "route" && source === "route" && currentNameHasWildcard);
    if (isImprovement) {
      activeRootSpan.updateName(name);
      activeRootSpan.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_SOURCE, source);
      if (!transactionNameHasWildcard(name) && source === "route") {
        addNonEnumerableProperty(
          activeRootSpan,
          "__sentry_navigation_name_set__",
          true
        );
      }
    }
  }
}
function setupRouterSubscription(router, routes, version, basename2, activeRootSpan) {
  let isInitialPageloadComplete = false;
  let hasSeenPageloadSpan = !!activeRootSpan && spanToJSON(activeRootSpan).op === "pageload";
  let hasSeenPopAfterPageload = false;
  let scheduledNavigationHandler = null;
  let lastHandledPathname = null;
  router.subscribe((state) => {
    if (!isInitialPageloadComplete) {
      const currentRootSpan = getActiveRootSpan();
      const isCurrentlyInPageload = currentRootSpan && spanToJSON(currentRootSpan).op === "pageload";
      if (isCurrentlyInPageload) {
        hasSeenPageloadSpan = true;
      } else if (hasSeenPageloadSpan) {
        if (state.historyAction === "POP" && !hasSeenPopAfterPageload) {
          hasSeenPopAfterPageload = true;
        } else {
          isInitialPageloadComplete = true;
        }
      }
    }
    const shouldHandleNavigation = state.historyAction === "PUSH" || state.historyAction === "POP" && isInitialPageloadComplete;
    if (shouldHandleNavigation) {
      const currentLocationKey = computeLocationKey(state.location);
      const navigationHandler = () => {
        if (lastHandledPathname === currentLocationKey) {
          return;
        }
        lastHandledPathname = currentLocationKey;
        scheduledNavigationHandler = null;
        handleNavigation({
          location: state.location,
          routes,
          navigationType: state.historyAction,
          version,
          basename: basename2,
          allRoutes: Array.from(allRoutes)
        });
      };
      if (state.navigation.state !== "idle") {
        if (lastHandledPathname !== currentLocationKey) {
          lastHandledPathname = null;
        }
        if (scheduledNavigationHandler !== null) {
          cancelScheduledCallback(scheduledNavigationHandler);
        }
        scheduledNavigationHandler = scheduleCallback(navigationHandler);
      } else {
        if (scheduledNavigationHandler !== null) {
          cancelScheduledCallback(scheduledNavigationHandler);
          scheduledNavigationHandler = null;
        }
        navigationHandler();
      }
    }
  });
}
function createV6CompatibleWrapCreateBrowserRouter(createRouterFunction, version) {
  if (!_useEffect || !_useLocation || !_useNavigationType || !_matchRoutes) {
    DEBUG_BUILD && debug$2.warn(
      `reactRouterV${version}Instrumentation was unable to wrap the \`createRouter\` function because of one or more missing parameters.`
    );
    return createRouterFunction;
  }
  return function(routes, opts) {
    addRoutesToAllRoutes(routes);
    if (_enableAsyncRouteHandlers) {
      for (const route of routes) {
        checkRouteForAsyncHandler(route, processResolvedRoutes);
      }
    }
    const activeRootSpan = getActiveRootSpan();
    const hasPatchRoutesOnNavigation = opts && "patchRoutesOnNavigation" in opts && typeof opts.patchRoutesOnNavigation === "function";
    if (hasPatchRoutesOnNavigation && activeRootSpan) {
      addNonEnumerableProperty(
        activeRootSpan,
        "__sentry_may_have_lazy_routes__",
        true
      );
      createDeferredLazyRoutePromise(activeRootSpan);
    }
    const wrappedOpts = wrapPatchRoutesOnNavigation(opts, false, activeRootSpan);
    const router = createRouterFunction(routes, wrappedOpts);
    const basename2 = opts?.basename;
    if (router.state.historyAction === "POP" && activeRootSpan) {
      updatePageloadTransaction({
        activeRootSpan,
        location: router.state.location,
        routes,
        basename: basename2,
        allRoutes: Array.from(allRoutes)
      });
    }
    _basename = basename2 || "";
    setupRouterSubscription(router, routes, version, basename2, activeRootSpan);
    return router;
  };
}
function createV6CompatibleWrapCreateMemoryRouter(createRouterFunction, version) {
  if (!_useEffect || !_useLocation || !_useNavigationType || !_matchRoutes) {
    DEBUG_BUILD && debug$2.warn(
      `reactRouterV${version}Instrumentation was unable to wrap the \`createMemoryRouter\` function because of one or more missing parameters.`
    );
    return createRouterFunction;
  }
  return function(routes, opts) {
    addRoutesToAllRoutes(routes);
    if (_enableAsyncRouteHandlers) {
      for (const route of routes) {
        checkRouteForAsyncHandler(route, processResolvedRoutes);
      }
    }
    const memoryActiveRootSpanEarly = getActiveRootSpan();
    const hasPatchRoutesOnNavigation = opts && "patchRoutesOnNavigation" in opts && typeof opts.patchRoutesOnNavigation === "function";
    if (hasPatchRoutesOnNavigation && memoryActiveRootSpanEarly) {
      addNonEnumerableProperty(
        memoryActiveRootSpanEarly,
        "__sentry_may_have_lazy_routes__",
        true
      );
      createDeferredLazyRoutePromise(memoryActiveRootSpanEarly);
    }
    const wrappedOpts = wrapPatchRoutesOnNavigation(opts, true, memoryActiveRootSpanEarly);
    const router = createRouterFunction(routes, wrappedOpts);
    const basename2 = opts?.basename;
    let initialEntry = void 0;
    const initialEntries = opts?.initialEntries;
    const initialIndex = opts?.initialIndex;
    const hasOnlyOneInitialEntry = initialEntries?.length === 1;
    const hasIndexedEntry = initialIndex !== void 0 && initialEntries?.[initialIndex];
    initialEntry = hasOnlyOneInitialEntry ? initialEntries[0] : hasIndexedEntry ? initialEntries[initialIndex] : void 0;
    const location = initialEntry ? typeof initialEntry === "string" ? { pathname: initialEntry } : initialEntry : router.state.location;
    const memoryActiveRootSpan = getActiveRootSpan();
    if (router.state.historyAction === "POP" && memoryActiveRootSpan) {
      updatePageloadTransaction({
        activeRootSpan: memoryActiveRootSpan,
        location,
        routes,
        basename: basename2,
        allRoutes: Array.from(allRoutes)
      });
    }
    _basename = basename2 || "";
    setupRouterSubscription(router, routes, version, basename2, memoryActiveRootSpan);
    return router;
  };
}
function createReactRouterV6CompatibleTracingIntegration(options, version) {
  const integration = browserTracingIntegration({ ...options, instrumentPageLoad: false, instrumentNavigation: false });
  const {
    useEffect,
    useLocation,
    useNavigationType,
    createRoutesFromChildren,
    matchRoutes: matchRoutes2,
    stripBasename,
    enableAsyncRouteHandlers = false,
    instrumentPageLoad = true,
    instrumentNavigation = true,
    lazyRouteTimeout,
    lazyRouteManifest
  } = options;
  return {
    ...integration,
    setup(client) {
      integration.setup(client);
      const finalTimeout = options.finalTimeout ?? 3e4;
      const defaultMaxWait = (options.idleTimeout ?? 1e3) * 3;
      const configuredMaxWait = lazyRouteTimeout ?? defaultMaxWait;
      if (configuredMaxWait === Infinity) {
        _lazyRouteTimeout = finalTimeout;
        DEBUG_BUILD && debug$2.log(
          "[React Router] lazyRouteTimeout set to Infinity, capping at finalTimeout:",
          finalTimeout,
          "ms to prevent indefinite hangs"
        );
      } else if (Number.isNaN(configuredMaxWait)) {
        DEBUG_BUILD && debug$2.warn("[React Router] lazyRouteTimeout must be a number, falling back to default:", defaultMaxWait);
        _lazyRouteTimeout = defaultMaxWait;
      } else if (configuredMaxWait < 0) {
        DEBUG_BUILD && debug$2.warn(
          "[React Router] lazyRouteTimeout must be non-negative or Infinity, got:",
          configuredMaxWait,
          "falling back to:",
          defaultMaxWait
        );
        _lazyRouteTimeout = defaultMaxWait;
      } else {
        _lazyRouteTimeout = configuredMaxWait;
      }
      _useEffect = useEffect;
      _useLocation = useLocation;
      _useNavigationType = useNavigationType;
      _matchRoutes = matchRoutes2;
      _createRoutesFromChildren = createRoutesFromChildren;
      _enableAsyncRouteHandlers = enableAsyncRouteHandlers;
      _lazyRouteManifest = lazyRouteManifest;
      initializeRouterUtils(matchRoutes2, stripBasename || false);
    },
    afterAllSetup(client) {
      integration.afterAllSetup(client);
      const initPathName = WINDOW$4.location?.pathname;
      if (instrumentPageLoad && initPathName) {
        startBrowserTracingPageLoadSpan(client, {
          name: initPathName,
          attributes: {
            [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: "url",
            [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "pageload",
            [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: `auto.pageload.react.reactrouter_v${version}`
          }
        });
      }
      if (instrumentNavigation) {
        CLIENTS_WITH_INSTRUMENT_NAVIGATION.add(client);
      }
    }
  };
}
function createV6CompatibleWrapUseRoutes(origUseRoutes, version) {
  if (!_useEffect || !_useLocation || !_useNavigationType || !_matchRoutes) {
    DEBUG_BUILD && debug$2.warn(
      "reactRouterV6Instrumentation was unable to wrap `useRoutes` because of one or more missing parameters."
    );
    return origUseRoutes;
  }
  const SentryRoutes = (props) => {
    const isMountRenderPass = reactExports.useRef(true);
    const { routes, locationArg } = props;
    const Routes = origUseRoutes(routes, locationArg);
    const location = _useLocation();
    const navigationType = _useNavigationType();
    const stableLocationParam = typeof locationArg === "string" || locationArg?.pathname ? locationArg : location;
    _useEffect(() => {
      const normalizedLocation = typeof stableLocationParam === "string" ? { pathname: stableLocationParam } : stableLocationParam;
      if (isMountRenderPass.current) {
        addRoutesToAllRoutes(routes);
        updatePageloadTransaction({
          activeRootSpan: getActiveRootSpan(),
          location: normalizedLocation,
          routes,
          allRoutes: Array.from(allRoutes)
        });
        isMountRenderPass.current = false;
      } else {
        handleNavigation({
          location: normalizedLocation,
          routes,
          navigationType,
          version,
          allRoutes: Array.from(allRoutes)
        });
      }
    }, [navigationType, stableLocationParam]);
    return Routes;
  };
  return (routes, locationArg) => {
    return /* @__PURE__ */ reactExports.createElement(SentryRoutes, { routes, locationArg });
  };
}
function wrapPatchRoutesOnNavigation(opts, isMemoryRouter = false, capturedSpan) {
  if (!opts || !("patchRoutesOnNavigation" in opts) || typeof opts.patchRoutesOnNavigation !== "function") {
    return opts || {};
  }
  const originalPatchRoutes = opts.patchRoutesOnNavigation;
  return {
    ...opts,
    patchRoutesOnNavigation: async (args) => {
      const targetPath = args?.path;
      const activeRootSpan = getActiveRootSpan() ?? capturedSpan;
      if (!isMemoryRouter) {
        const originalPatch = args?.patch;
        const matches = args?.matches;
        if (originalPatch) {
          args.patch = (routeId, children) => {
            addRoutesToAllRoutes(children);
            if (matches && matches.length > 0) {
              const leafMatch = matches[matches.length - 1];
              const leafRoute = leafMatch?.route;
              if (leafRoute) {
                const matchingRoute = Array.from(allRoutes).find((route) => {
                  const idMatches = route.id !== void 0 && route.id === routeId;
                  const referenceMatches = route === leafRoute;
                  const pathMatches = route.path !== void 0 && leafRoute.path !== void 0 && route.path === leafRoute.path;
                  return idMatches || referenceMatches || pathMatches;
                });
                if (matchingRoute) {
                  addResolvedRoutesToParent(children, matchingRoute);
                }
              }
            }
            const spanJson = activeRootSpan ? spanToJSON(activeRootSpan) : void 0;
            if (targetPath && activeRootSpan && spanJson && !spanJson.timestamp && // Span hasn't ended yet
            spanJson.op === "navigation") {
              updateNavigationSpan(
                activeRootSpan,
                { pathname: targetPath, search: "", hash: "", state: null, key: "default" },
                Array.from(allRoutes),
                true,
                _matchRoutes
              );
            }
            return originalPatch(routeId, children);
          };
        }
      }
      const lazyLoadPromise = (async () => {
        const contextToken = setNavigationContext(targetPath, activeRootSpan);
        let result;
        try {
          result = await originalPatchRoutes(args);
        } finally {
          clearNavigationContext(contextToken);
          if (activeRootSpan) {
            resolveDeferredLazyRoutePromise(activeRootSpan);
          }
        }
        const spanJson = activeRootSpan ? spanToJSON(activeRootSpan) : void 0;
        if (activeRootSpan && spanJson && !spanJson.timestamp && // Span hasn't ended yet
        spanJson.op === "navigation") {
          const pathname = targetPath;
          if (pathname) {
            updateNavigationSpan(
              activeRootSpan,
              { pathname, search: "", hash: "", state: null, key: "default" },
              Array.from(allRoutes),
              false,
              _matchRoutes
            );
          }
        }
        return result;
      })();
      if (activeRootSpan) {
        trackLazyRouteLoad(activeRootSpan, lazyLoadPromise);
      }
      return lazyLoadPromise;
    }
  };
}
function handleNavigation(opts) {
  const { location, routes, navigationType, version, matches, basename: basename2, allRoutes: allRoutes2 } = opts;
  const branches = Array.isArray(matches) ? matches : _matchRoutes(allRoutes2 || routes, location, basename2);
  const client = getClient();
  if (!client || !CLIENTS_WITH_INSTRUMENT_NAVIGATION.has(client)) {
    return;
  }
  const activeRootSpan = getActiveRootSpan();
  if (activeRootSpan && spanToJSON(activeRootSpan).op === "pageload" && navigationType === "POP") {
    return;
  }
  if ((navigationType === "PUSH" || navigationType === "POP") && branches) {
    const [name, source] = resolveRouteNameAndSource(
      location,
      allRoutes2 || routes,
      allRoutes2 || routes,
      branches,
      basename2,
      _lazyRouteManifest,
      _enableAsyncRouteHandlers
    );
    const locationKey = computeLocationKey(location);
    const trackedNav = activeNavigationSpans.get(client);
    const trackedSpanHasEnded = trackedNav && !trackedNav.isPlaceholder ? !!spanToJSON(trackedNav.span).timestamp : false;
    const { skip, shouldUpdate } = shouldSkipNavigation(trackedNav, locationKey, name, trackedSpanHasEnded);
    if (skip) {
      if (shouldUpdate && trackedNav) {
        const oldName = trackedNav.routeName;
        if (trackedNav.isPlaceholder) {
          trackedNav.routeName = name;
          DEBUG_BUILD && debug$2.log(
            `[Tracing] Updated placeholder navigation name from "${oldName}" to "${name}" (will apply to real span)`
          );
        } else {
          trackedNav.span.updateName(name);
          trackedNav.span.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_SOURCE, source);
          addNonEnumerableProperty(
            trackedNav.span,
            "__sentry_navigation_name_set__",
            true
          );
          trackedNav.routeName = name;
          DEBUG_BUILD && debug$2.log(`[Tracing] Updated navigation span name from "${oldName}" to "${name}"`);
        }
      } else {
        DEBUG_BUILD && debug$2.log(`[Tracing] Skipping duplicate navigation for location: ${locationKey}`);
      }
      return;
    }
    const placeholderSpan = { end: () => {
    } };
    const placeholderEntry = {
      span: placeholderSpan,
      routeName: name,
      pathname: location.pathname,
      locationKey,
      isPlaceholder: true
    };
    activeNavigationSpans.set(client, placeholderEntry);
    let navigationSpan;
    try {
      navigationSpan = startBrowserTracingNavigationSpan(client, {
        name: placeholderEntry.routeName,
        // Use placeholder's routeName in case it was updated
        attributes: {
          [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: source,
          [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "navigation",
          [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: `auto.navigation.react.reactrouter_v${version}`
        }
      });
    } catch (e2) {
      activeNavigationSpans.delete(client);
      throw e2;
    }
    if (navigationSpan) {
      activeNavigationSpans.set(client, {
        span: navigationSpan,
        routeName: placeholderEntry.routeName,
        // Use the (potentially updated) placeholder routeName
        pathname: location.pathname,
        locationKey
      });
      patchSpanEnd(navigationSpan, location, routes, basename2, "navigation");
    } else {
      activeNavigationSpans.delete(client);
    }
  }
}
function addRoutesToAllRoutes(routes) {
  routes.forEach((route) => {
    const extractedChildRoutes = getChildRoutesRecursively(route);
    extractedChildRoutes.forEach((r2) => {
      allRoutes.add(r2);
    });
  });
}
function getChildRoutesRecursively(route, allRoutes2 = /* @__PURE__ */ new Set()) {
  if (!allRoutes2.has(route)) {
    allRoutes2.add(route);
    if (route.children && !route.index) {
      route.children.forEach((child) => {
        const childRoutes = getChildRoutesRecursively(child, allRoutes2);
        childRoutes.forEach((r2) => {
          allRoutes2.add(r2);
        });
      });
    }
  }
  return allRoutes2;
}
function updatePageloadTransaction({
  activeRootSpan,
  location,
  routes,
  matches,
  basename: basename2,
  allRoutes: allRoutes2
}) {
  const branches = Array.isArray(matches) ? matches : _matchRoutes(allRoutes2 || routes, location, basename2);
  if (branches) {
    const [name, source] = resolveRouteNameAndSource(
      location,
      allRoutes2 || routes,
      allRoutes2 || routes,
      branches,
      basename2,
      _lazyRouteManifest,
      _enableAsyncRouteHandlers
    );
    getCurrentScope().setTransactionName(name || "/");
    if (activeRootSpan) {
      activeRootSpan.updateName(name);
      activeRootSpan.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_SOURCE, source);
      patchSpanEnd(activeRootSpan, location, routes, basename2, "pageload");
    }
  } else if (activeRootSpan) {
    patchSpanEnd(activeRootSpan, location, routes, basename2, "pageload");
  }
}
function shouldUpdateWildcardSpanName(currentName, currentSource, newName, newSource, allowNoCurrentName = false) {
  if (!newName) {
    return false;
  }
  if (!currentName && allowNoCurrentName) {
    return true;
  }
  const hasWildcard = currentName && transactionNameHasWildcard(currentName);
  if (hasWildcard && newSource === "route" && !transactionNameHasWildcard(newName)) {
    return true;
  }
  if (currentSource !== "route" && newSource === "route") {
    return true;
  }
  return false;
}
function tryUpdateSpanNameBeforeEnd(span, spanJson, currentName, location, routes, basename2, spanType, allRoutes2) {
  try {
    const currentSource = spanJson.data?.[SEMANTIC_ATTRIBUTE_SENTRY_SOURCE];
    if (currentSource === "route" && currentName && !transactionNameHasWildcard(currentName)) {
      return;
    }
    const currentAllRoutes = Array.from(allRoutes2);
    const routesToUse = currentAllRoutes.length > 0 ? currentAllRoutes : routes;
    const branches = _matchRoutes(routesToUse, location, basename2);
    if (!branches) {
      return;
    }
    const [name, source] = resolveRouteNameAndSource(
      location,
      routesToUse,
      routesToUse,
      branches,
      basename2,
      _lazyRouteManifest,
      _enableAsyncRouteHandlers
    );
    const isImprovement = shouldUpdateWildcardSpanName(currentName, currentSource, name, source, true);
    const spanNotEnded = spanType === "pageload" || !spanJson.timestamp;
    if (isImprovement && spanNotEnded) {
      span.updateName(name);
      span.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_SOURCE, source);
    }
  } catch (error2) {
    DEBUG_BUILD && debug$2.warn(`Error updating span details before ending: ${error2}`);
  }
}
function patchSpanEnd(span, location, routes, basename2, spanType) {
  const patchedPropertyName = `__sentry_${spanType}_end_patched__`;
  const hasEndBeenPatched = span?.[patchedPropertyName];
  if (hasEndBeenPatched || !span.end) {
    return;
  }
  const originalEnd = span.end.bind(span);
  let endCalled = false;
  span.end = function patchedEnd(...args) {
    if (endCalled) {
      return;
    }
    endCalled = true;
    const endTimestamp = args.length > 0 ? args[0] : Date.now() / 1e3;
    const spanJson = spanToJSON(span);
    const currentName = spanJson.description;
    const currentSource = spanJson.data?.[SEMANTIC_ATTRIBUTE_SENTRY_SOURCE];
    const cleanupNavigationSpan = () => {
      const client = getClient();
      if (client && spanType === "navigation") {
        const trackedNav = activeNavigationSpans.get(client);
        if (trackedNav && trackedNav.span === span) {
          activeNavigationSpans.delete(client);
        }
      }
    };
    const pendingPromises = pendingLazyRouteLoads.get(span);
    const mayHaveLazyRoutes = span.__sentry_may_have_lazy_routes__;
    const hasPendingOrMayHaveLazyRoutes = pendingPromises && pendingPromises.size > 0 || mayHaveLazyRoutes;
    const shouldWaitForLazyRoutes = hasPendingOrMayHaveLazyRoutes && currentName && (transactionNameHasWildcard(currentName) || currentSource !== "route");
    if (shouldWaitForLazyRoutes) {
      if (_lazyRouteTimeout === 0) {
        tryUpdateSpanNameBeforeEnd(span, spanJson, currentName, location, routes, basename2, spanType, allRoutes);
        cleanupNavigationSpan();
        originalEnd(endTimestamp);
        return;
      }
      const timeoutPromise = new Promise((r2) => setTimeout(r2, _lazyRouteTimeout));
      let waitPromise;
      if (pendingPromises && pendingPromises.size > 0) {
        const allSettled = Promise.allSettled(pendingPromises).then(() => {
        });
        waitPromise = _lazyRouteTimeout === Infinity ? allSettled : Promise.race([allSettled, timeoutPromise]);
      } else {
        waitPromise = timeoutPromise;
      }
      waitPromise.then(() => {
        const updatedSpanJson = spanToJSON(span);
        tryUpdateSpanNameBeforeEnd(
          span,
          updatedSpanJson,
          updatedSpanJson.description,
          location,
          routes,
          basename2,
          spanType,
          allRoutes
        );
        cleanupNavigationSpan();
        originalEnd(endTimestamp);
      }).catch(() => {
        cleanupNavigationSpan();
        originalEnd(endTimestamp);
      });
      return;
    }
    tryUpdateSpanNameBeforeEnd(span, spanJson, currentName, location, routes, basename2, spanType, allRoutes);
    cleanupNavigationSpan();
    originalEnd(endTimestamp);
  };
  addNonEnumerableProperty(span, patchedPropertyName, true);
}
function createV6CompatibleWithSentryReactRouterRouting(Routes, version) {
  if (!_useEffect || !_useLocation || !_useNavigationType || !_createRoutesFromChildren || !_matchRoutes) {
    DEBUG_BUILD && debug$2.warn(`reactRouterV6Instrumentation was unable to wrap Routes because of one or more missing parameters.
      useEffect: ${_useEffect}. useLocation: ${_useLocation}. useNavigationType: ${_useNavigationType}.
      createRoutesFromChildren: ${_createRoutesFromChildren}. matchRoutes: ${_matchRoutes}.`);
    return Routes;
  }
  const SentryRoutes = (props) => {
    const isMountRenderPass = reactExports.useRef(true);
    const location = _useLocation();
    const navigationType = _useNavigationType();
    _useEffect(
      () => {
        const routes = _createRoutesFromChildren(props.children);
        if (isMountRenderPass.current) {
          addRoutesToAllRoutes(routes);
          updatePageloadTransaction({
            activeRootSpan: getActiveRootSpan(),
            location,
            routes,
            allRoutes: Array.from(allRoutes)
          });
          isMountRenderPass.current = false;
        } else {
          handleNavigation({ location, routes, navigationType, version, allRoutes: Array.from(allRoutes) });
        }
      },
      // Re-run only on location/navigation changes, not children changes
      [location, navigationType]
    );
    return /* @__PURE__ */ reactExports.createElement(Routes, { ...props });
  };
  hoistNonReactStatics(SentryRoutes, Routes);
  return SentryRoutes;
}
function reactRouterV6BrowserTracingIntegration(options) {
  return createReactRouterV6CompatibleTracingIntegration(options, "6");
}
function wrapUseRoutesV6(origUseRoutes) {
  return createV6CompatibleWrapUseRoutes(origUseRoutes, "6");
}
function wrapCreateBrowserRouterV6(createRouterFunction) {
  return createV6CompatibleWrapCreateBrowserRouter(createRouterFunction, "6");
}
function wrapCreateMemoryRouterV6(createMemoryRouterFunction) {
  return createV6CompatibleWrapCreateMemoryRouter(createMemoryRouterFunction, "6");
}
function withSentryReactRouterV6Routing(routes) {
  return createV6CompatibleWithSentryReactRouterRouting(routes, "6");
}
function reactRouterV7BrowserTracingIntegration(options) {
  return createReactRouterV6CompatibleTracingIntegration(options, "7");
}
function withSentryReactRouterV7Routing(routes) {
  return createV6CompatibleWithSentryReactRouterRouting(routes, "7");
}
function wrapCreateBrowserRouterV7(createRouterFunction) {
  return createV6CompatibleWrapCreateBrowserRouter(createRouterFunction, "7");
}
function wrapCreateMemoryRouterV7(createMemoryRouterFunction) {
  return createV6CompatibleWrapCreateMemoryRouter(createMemoryRouterFunction, "7");
}
function wrapUseRoutesV7(origUseRoutes) {
  return createV6CompatibleWrapUseRoutes(origUseRoutes, "7");
}
export {
  BrowserClient,
  ErrorBoundary,
  MULTIPLEXED_TRANSPORT_EXTRA_KEY,
  OpenFeatureIntegrationHook,
  Profiler,
  SDK_VERSION,
  SEMANTIC_ATTRIBUTE_SENTRY_OP,
  SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN,
  SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE,
  SEMANTIC_ATTRIBUTE_SENTRY_SOURCE,
  ce as Scope,
  WINDOW$4 as WINDOW,
  addBreadcrumb,
  addEventProcessor,
  addIntegration,
  breadcrumbsIntegration,
  browserApiErrorsIntegration,
  browserProfilingIntegration,
  browserSessionIntegration,
  browserTracingIntegration,
  buildLaunchDarklyFlagUsedHandler,
  captureConsoleIntegration,
  captureEvent,
  captureException,
  captureFeedback,
  captureMessage,
  captureReactException,
  captureSession,
  chromeStackLineParser,
  cf as close,
  consoleLoggingIntegration,
  contextLinesIntegration,
  cg as continueTrace,
  createConsolaReporter,
  createLangChainCallbackHandler,
  createReduxEnhancer,
  createTransport,
  createUserFeedbackEnvelope,
  cultureContextIntegration,
  dedupeIntegration,
  defaultRequestInstrumentationOptions,
  defaultStackLineParsers,
  defaultStackParser,
  diagnoseSdkConnectivity,
  elementTimingIntegration,
  ch as endSession,
  ci as eventFiltersIntegration,
  eventFromException,
  eventFromMessage,
  exceptionFromError,
  extraErrorDataIntegration,
  featureFlagsIntegration,
  feedbackAsyncIntegration,
  feedbackSyncIntegration as feedbackIntegration,
  feedbackSyncIntegration,
  fetchStreamPerformanceIntegration,
  cj as flush,
  forceLoad,
  functionToStringIntegration,
  geckoStackLineParser,
  getActiveSpan,
  getClient,
  getCurrentScope,
  getDefaultIntegrations,
  getFeedback,
  getGlobalScope,
  getIsolationScope,
  getReplay,
  getRootSpan,
  getSpanDescendants,
  ck as getSpanStatusFromHttpCode,
  getTraceData,
  globalHandlersIntegration,
  graphqlClientIntegration,
  growthbookIntegration,
  httpClientIntegration,
  httpContextIntegration,
  inboundFiltersIntegration,
  init,
  instrumentAnthropicAiClient,
  instrumentCreateReactAgent,
  instrumentGoogleGenAIClient,
  instrumentLangChainEmbeddings,
  instrumentLangGraph,
  instrumentOpenAiClient,
  instrumentOutgoingRequests,
  instrumentSupabaseClient,
  isBotUserAgent,
  cl as isEnabled,
  cm as isInitialized,
  lastEventId,
  launchDarklyIntegration,
  lazyLoadIntegration,
  linkedErrorsIntegration,
  publicApi$1 as logger,
  makeBrowserOfflineTransport,
  makeFetchTransport,
  makeMultiplexedTransport,
  publicApi as metrics,
  moduleMetadataIntegration,
  normalizeStringifyValue$1 as normalizeStringifyValue,
  onLoad,
  openFeatureIntegration,
  opera10StackLineParser,
  opera11StackLineParser,
  parameterize,
  reactErrorHandler,
  reactRouterV3BrowserTracingIntegration,
  reactRouterV4BrowserTracingIntegration,
  reactRouterV5BrowserTracingIntegration,
  reactRouterV6BrowserTracingIntegration,
  reactRouterV7BrowserTracingIntegration,
  registerSpanErrorInstrumentation,
  registerWebWorker,
  replayCanvasIntegration,
  replayIntegration,
  reportPageLoaded,
  reportingObserverIntegration,
  rewriteFramesIntegration,
  sendFeedback,
  setActiveSpanInBrowser,
  setContext,
  cn as setConversationId,
  co as setCurrentClient,
  cp as setExtra,
  cq as setExtras,
  setHttpStatus,
  setMeasurement,
  cr as setTag,
  cs as setTags,
  ct as setUser,
  showReportDialog,
  spanStreamingIntegration,
  cu as spanToBaggageHeader,
  spanToJSON,
  cv as spanToTraceHeader,
  spotlightBrowserIntegration,
  startBrowserTracingNavigationSpan,
  startBrowserTracingPageLoadSpan,
  startInactiveSpan,
  cw as startNewTrace,
  startSession,
  startSpan,
  startSpanManual,
  statsigIntegration,
  supabaseIntegration,
  suppressTracing,
  tanstackRouterBrowserTracingIntegration,
  thirdPartyErrorFilterIntegration,
  uiProfiler,
  unleashIntegration,
  cx as updateSpanName,
  useProfiler,
  viewHierarchyIntegration,
  webWorkerIntegration,
  winjsStackLineParser,
  withActiveSpan,
  withErrorBoundary,
  cy as withIsolationScope,
  withProfiler,
  withScope,
  withSentryReactRouterV6Routing,
  withSentryReactRouterV7Routing,
  withSentryRouting,
  cz as withStreamedSpan,
  wrapCreateBrowserRouterV6,
  wrapCreateBrowserRouterV7,
  wrapCreateMemoryRouterV6,
  wrapCreateMemoryRouterV7,
  wrapUseRoutesV6,
  wrapUseRoutesV7,
  zodErrorsIntegration
};

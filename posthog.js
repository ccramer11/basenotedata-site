// PostHog: visitor-level event logs for basenotedata.com.
// Loaded on every page right after the GA4 snippet.
// - Page views, page leaves and autocapture (clicks, form submits) are on by default.
// - Every existing gtag('event', ...) call (quiz start/complete, book_call_click, generate_lead,
//   newsletter_signup, etc.) is mirrored to PostHog automatically, so no per-event rewiring is needed.
// - book-call.js and site-cta.js call posthog.identify(email) so anonymous browsing history
//   gets attached to the person once they hand over an email.
(function(){
  var KEY='REPLACE_WITH_POSTHOG_PROJECT_KEY'; // public project key (phc_...), safe to ship in client code
  var HOST='https://us.i.posthog.com';        // use https://eu.i.posthog.com for an EU project
  if(!KEY || KEY.indexOf('phc_')!==0) return;

  /* Official PostHog snippet */
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  posthog.init(KEY,{
    api_host:HOST,
    person_profiles:'always',      // create a profile for anonymous visitors too
    capture_pageview:true,
    capture_pageleave:true
  });

  // Mirror existing GA4 events into PostHog.
  var orig=window.gtag;
  if(typeof orig==='function'){
    window.gtag=function(){
      try{
        var a=arguments;
        if(a[0]==='event' && a[1]){
          var p={}, src=a[2]||{};
          for(var k in src){ if(k!=='event_callback' && k!=='event_timeout' && k!=='transport_type') p[k]=src[k]; }
          posthog.capture(a[1],p);
        }
      }catch(err){}
      return orig.apply(this,arguments);
    };
  }
})();

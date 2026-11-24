// Newsletter signup bar: sends the email to chelsea@basenotedata.com via FormSubmit, no page reload.
// (The form's plain action/method still works as a fallback if this script doesn't load.)
// Fires a GA4 "newsletter_signup" event only. It deliberately does not fire the lead-conversion
// events used for the call-booking and contact forms, so newsletter signups don't count as leads in ad reporting.
(function(){
  var ENDPOINT='https://formsubmit.co/ajax/chelsea@basenotedata.com';

  function setup(form){
    var msg=form.querySelector('.nl-msg'), btn=form.querySelector('.nl-btn');
    form.addEventListener('submit',function(e){
      e.preventDefault();
      if(!form.checkValidity()){ form.reportValidity(); return; }
      if(form.elements['_honey'] && form.elements['_honey'].value) return;
      var email=form.elements['email'].value.trim();
      btn.disabled=true; btn.textContent='Sending…'; msg.textContent=''; msg.className='nl-msg';

      function fail(){
        btn.disabled=false; btn.textContent='Subscribe';
        msg.className='nl-msg err';
        msg.textContent='Something went wrong. Please try again, or email chelsea@basenotedata.com.';
      }

      fetch(ENDPOINT,{
        method:'POST',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify({
          email:email,
          source:'newsletter bar',
          page:location.pathname,
          _subject:'New newsletter signup — Base Note Data',
          _template:'table',
          _captcha:'false'
        })
      }).then(function(r){ return r.json().catch(function(){ return {}; }).then(function(d){ return r.ok && d.success!==false && d.success!=='false'; }); })
        .then(function(ok){
          if(!ok){ fail(); return; }
          try{ window.posthog && posthog.identify(email,{email:email}); }catch(err){}
          try{ window.gtag && gtag('event','newsletter_signup',{method:'newsletter_bar',page_path:location.pathname}); }catch(err){}
          form.classList.add('done');
          msg.textContent='Thanks, you’re on the list.';
        })
        .catch(fail);
    });
  }

  var forms=document.querySelectorAll('form.nl-form');
  for(var i=0;i<forms.length;i++) setup(forms[i]);
})();

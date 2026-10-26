// "Book a call" lead capture.
// Every booking link (Calendly, or the Google appointment page on /services) opens a short form first.
// On submit: the details are emailed via FormSubmit, conversions fire (OpenAI Ads lead_created,
// GA4 generate_lead, Google Ads conversion_event_submit_lead_form), then the visitor continues to the
// booking page with name and email prefilled. Navigation waits at most ~2s so tracking never blocks anyone.
(function(){
  var SELECTOR='a[href*="calendly.com"], a[href*="appointments/schedules"]';
  var ENDPOINT='https://formsubmit.co/ajax/chelsea@basenotedata.com';

  var css=''+
    '.bc-dialog{border:1px solid var(--hairline-ink,rgba(243,230,222,.14));border-radius:4px;padding:0;'+
      'background:var(--ink,#241B24);color:var(--parchment-text,#F3E6DE);width:min(440px,calc(100vw - 32px));'+
      'font-family:Inter,sans-serif;font-size:15px;line-height:1.5;}'+
    '.bc-dialog::backdrop{background:rgba(20,14,20,.72);}'+
    '.bc-inner{padding:32px 28px 28px;position:relative;}'+
    '.bc-eyebrow{font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--amber,#D3987E);margin:0 0 10px;}'+
    '.bc-title{font-family:Fraunces,serif;font-weight:500;font-size:26px;line-height:1.2;margin:0 0 8px;}'+
    '.bc-sub{color:var(--muted-on-ink,#A8919E);margin:0 0 22px;}'+
    '.bc-form{display:flex;flex-direction:column;gap:16px;}'+
    '.bc-form label{display:block;font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted-on-ink,#A8919E);margin-bottom:6px;}'+
    '.bc-form input{width:100%;box-sizing:border-box;background:var(--ink-soft,#2E222E);border:1px solid var(--hairline-ink,rgba(243,230,222,.14));border-radius:2px;padding:12px 14px;color:var(--parchment-text,#F3E6DE);font:inherit;}'+
    '.bc-form input:focus-visible{outline:none;border-color:var(--amber,#D3987E);box-shadow:0 0 0 3px rgba(211,152,126,.2);}'+
    '.bc-submit{margin-top:4px;background:var(--amber,#D3987E);color:var(--ink,#241B24);border:1px solid var(--amber,#D3987E);border-radius:2px;padding:13px 20px;font:inherit;font-weight:600;cursor:pointer;}'+
    '.bc-submit:hover,.bc-submit:focus-visible{background:transparent;color:var(--amber,#D3987E);}'+
    '.bc-submit[disabled]{opacity:.6;cursor:wait;}'+
    '.bc-close{position:absolute;top:12px;right:12px;background:none;border:0;color:var(--muted-on-ink,#A8919E);font-size:22px;line-height:1;padding:6px 8px;cursor:pointer;}'+
    '.bc-close:hover,.bc-close:focus-visible{color:var(--amber,#D3987E);}'+
    '.bc-honey{position:absolute;left:-9999px;}';

  var dialog, form, bookingUrl='';

  function build(){
    var style=document.createElement('style'); style.textContent=css; document.head.appendChild(style);
    dialog=document.createElement('dialog');
    dialog.className='bc-dialog';
    dialog.setAttribute('aria-labelledby','bc-title');
    dialog.innerHTML=
      '<div class="bc-inner">'+
        '<button type="button" class="bc-close" aria-label="Close">×</button>'+
        '<p class="bc-eyebrow">30-min intro call</p>'+
        '<h2 class="bc-title" id="bc-title">Let\'s find a time</h2>'+
        '<p class="bc-sub">A few details first, then you\'ll pick a slot on my calendar.</p>'+
        '<form class="bc-form" novalidate>'+
          '<input type="text" name="_honey" class="bc-honey" tabindex="-1" autocomplete="off" aria-hidden="true">'+
          '<div><label for="bc-name">Name</label><input id="bc-name" name="name" type="text" autocomplete="name" required></div>'+
          '<div><label for="bc-email">Work email</label><input id="bc-email" name="email" type="email" autocomplete="email" required></div>'+
          '<div><label for="bc-company">Company (optional)</label><input id="bc-company" name="company" type="text" autocomplete="organization"></div>'+
          '<button type="submit" class="bc-submit">Continue to booking</button>'+
        '</form>'+
      '</div>';
    document.body.appendChild(dialog);
    form=dialog.querySelector('form');
    dialog.querySelector('.bc-close').addEventListener('click',function(){ dialog.close(); });
    dialog.addEventListener('click',function(e){ if(e.target===dialog) dialog.close(); });
    form.addEventListener('submit',onSubmit);
  }

  function withPrefill(url,name,email){
    if(url.indexOf('calendly.com')===-1) return url;
    try{
      var u=new URL(url);
      if(name) u.searchParams.set('name',name);
      if(email) u.searchParams.set('email',email);
      return u.toString();
    }catch(err){ return url; }
  }

  function onSubmit(e){
    e.preventDefault();
    if(!form.checkValidity()){ form.reportValidity(); return; }
    if(form.elements['_honey'].value) return;
    var btn=form.querySelector('.bc-submit'); btn.disabled=true; btn.textContent='One sec…';
    var name=form.elements['name'].value.trim(), email=form.elements['email'].value.trim(), company=form.elements['company'].value.trim();
    var dest=withPrefill(bookingUrl,name,email);

    var pending=2, done=false;
    function go(){ if(done) return; done=true; window.location.href=dest; }
    function step(){ if(--pending<=0) go(); }

    try{ window.oaiq && oaiq("measure","lead_created",{type:"customer_action"}); }catch(err){}
    try{ window.gtag && gtag('event','generate_lead',{method:'book_call_form',transport_type:'beacon'}); }catch(err){}
    try{
      if(window.gtag){ gtag('event','conversion_event_submit_lead_form',{event_callback:step,event_timeout:2000}); }
      else step();
    }catch(err){ step(); }

    try{
      fetch(ENDPOINT,{
        method:'POST',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify({
          name:name, email:email, company:company,
          page:location.pathname,
          _subject:'New call request — Base Note Data',
          _template:'table', _captcha:'false'
        }),
        keepalive:true
      }).then(step,step);
    }catch(err){ step(); }

    setTimeout(go,2200);
  }

  document.addEventListener('click',function(e){
    var a=e.target.closest && e.target.closest(SELECTOR);
    if(!a || e.button!==0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    if(!window.HTMLDialogElement) return; // very old browsers: let the link work as before
    e.preventDefault();
    if(!dialog) build();
    bookingUrl=a.href;
    var btn=form.querySelector('.bc-submit'); btn.disabled=false; btn.textContent='Continue to booking';
    try{ window.gtag && gtag('event','book_call_click',{link_url:a.href,transport_type:'beacon'}); }catch(err){}
    dialog.showModal();
    form.elements['name'].focus();
  });
})();

(function () {
  var D = window.LIBAN || { routes: [], wa: '254107080689' };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var fmt = function (n) { return 'KES ' + n.toLocaleString('en-US'); };
  var wa = function (msg) { return 'https://wa.me/' + D.wa + '?text=' + encodeURIComponent(msg); };
  var today = function () { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  var nice = function (iso) { var d = new Date(iso + 'T00:00:00'); return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); };
  var find = function (f, t) { return D.routes.filter(function (r) { return r.from === f && r.to === t; })[0]; };

  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  // mobile menu
  var mt = $('#menu-toggle'), mm = $('#mobile-menu');
  if (mt && mm) mt.addEventListener('click', function () {
    var open = mm.classList.toggle('open');
    mt.setAttribute('aria-expanded', open);
  });

  // search form
  var form = $('#search-form');
  if (form) {
    var from = $('#from'), to = $('#to'), date = $('#date'), pax = $('#passenger-count');
    var origins = []; D.routes.forEach(function (r) { if (origins.indexOf(r.from) < 0) origins.push(r.from); });
    var params = new URLSearchParams(location.search);
    from.innerHTML = origins.map(function (o) { return '<option>' + o + '</option>'; }).join('');
    var fillTo = function (keep) {
      var opts = D.routes.filter(function (r) { return r.from === from.value; }).map(function (r) { return r.to; });
      to.innerHTML = opts.map(function (o) { return '<option>' + o + '</option>'; }).join('');
      if (keep && opts.indexOf(keep) >= 0) to.value = keep;
    };
    from.value = params.get('from') || 'Nairobi'; fillTo(params.get('to') || 'Garissa');
    date.min = today(); date.value = params.get('date') || today();
    pax.value = Math.min(10, Math.max(1, parseInt(params.get('passengers') || '1', 10) || 1));
    var update = function () {
      var r = find(from.value, to.value), n = Math.min(10, Math.max(1, parseInt(pax.value, 10) || 1));
      pax.value = n;
      $('#pax-minus').disabled = n <= 1; $('#pax-plus').disabled = n >= 10;
      $('#pax-n').textContent = n; $('#pax-word').textContent = n === 1 ? 'seat' : 'seats'; $('#pax-label').textContent = n === 1 ? 'seat' : 'seats';
      if (r) { $('#fare-one').textContent = fmt(r.fare); $('#fare-total').textContent = fmt(r.fare * n); }
      $('#form-wa').href = wa('Hello Liban Bus, I would like to book ' + n + ' seat' + (n > 1 ? 's' : '') + ' from ' + from.value + ' to ' + to.value + ' on ' + nice(date.value) + '.' + (r ? ' Fare: ' + fmt(r.fare * n) + '.' : ''));
    };
    from.addEventListener('change', function () { fillTo(); update(); });
    [to, date, pax].forEach(function (el) { el.addEventListener('input', update); });
    $('#pax-minus').addEventListener('click', function () { pax.value = (parseInt(pax.value, 10) || 1) - 1; update(); });
    $('#pax-plus').addEventListener('click', function () { pax.value = (parseInt(pax.value, 10) || 1) + 1; update(); });
    $('#swap').addEventListener('click', function () {
      var f = from.value, t = to.value;
      if (find(t, f)) { from.value = t; fillTo(f); update(); }
      else alert('There is no direct service from ' + t + ' to ' + f + '.');
    });
    update();
  }

  // routes page: filter + results
  var list = $('#route-list');
  if (list) {
    var q = new URLSearchParams(location.search), f = q.get('from'), t = q.get('to');
    var date2 = q.get('date') || today(), n2 = Math.max(1, parseInt(q.get('passengers') || '1', 10) || 1);
    if (f && t) {
      var r = find(f, t);
      if (r) {
        $('#results').classList.remove('hidden');
        $('#res-title').textContent = f + ' → ' + t + ' · ' + fmt(r.fare) + ' per seat';
        $('#res-sub').textContent = nice(date2) + ' · ' + r.duration + ' · ' + r.km + ' km · ' + n2 + ' passenger' + (n2 > 1 ? 's' : '') + ' · Total ' + fmt(r.fare * n2) + ' · ' + r.classes.join(', ');
        $('#res-deps').innerHTML = r.deps.map(function (d) {
          var msg = 'Hello Liban Bus, I would like to book ' + n2 + ' seat' + (n2 > 1 ? 's' : '') + ' from ' + f + ' to ' + t + ' on ' + nice(date2) + ' on the ' + d + ' departure. Fare: ' + fmt(r.fare * n2) + '.';
          return '<a class="dep-btn" target="_blank" rel="noopener" href="' + wa(msg) + '"><span class="dep-time">' + d + '</span><span class="dep-cta">Book on WhatsApp</span></a>';
        }).join('');
        setTimeout(function () { $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
      } else { $('#res-none').classList.remove('hidden'); }
    }
    var filt = $('#filter'), cards = [].slice.call(list.querySelectorAll('.route-card'));
    filt.addEventListener('input', function () {
      var v = filt.value.trim().toLowerCase(), c = 0;
      cards.forEach(function (el) {
        var ok = !v || (el.dataset.from + ' ' + el.dataset.to).toLowerCase().indexOf(v) >= 0;
        el.classList.toggle('hidden-by-filter', !ok); if (ok) c++;
      });
      $('#count').textContent = c + ' scheduled service' + (c === 1 ? '' : 's');
    });
  }

  // contact + ticket forms -> WhatsApp
  var cf = $('#contact-form');
  if (cf) cf.addEventListener('submit', function (e) {
    e.preventDefault();
    window.open(wa('Hello Liban Bus, my name is ' + $('#c-name').value + '. ' + $('#c-msg').value), '_blank', 'noopener');
  });
  var tf = $('#ticket-form');
  if (tf) tf.addEventListener('submit', function (e) {
    e.preventDefault();
    var p = $('#t-phone').value;
    window.open(wa('Hello Liban Bus, please confirm my ticket. Booking reference: ' + $('#ref').value + (p ? '. Phone: ' + p : '') + '.'), '_blank', 'noopener');
  });
})();

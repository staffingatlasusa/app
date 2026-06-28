<?php
/**
 * Template Name: SA Talent Browse
 *
 * Fetches contractor profiles from staffingatlas.online API.
 * Falls back to empty state with a message if the API is unreachable.
 *
 * API: GET https://staffingatlas.online/api/contractors/public
 * Response: { contractors: PublicContractor[], count: number }
 */
require_once( get_stylesheet_directory() . '/sa-partials.php' );

// ── Fetch from Supabase API via Next.js route ────────────────────────────────

$api_url  = 'https://staffingatlas.online/api/contractors/public';
$response = wp_remote_get( $api_url, [
    'timeout'   => 10,
    'sslverify' => true,
    'headers'   => [ 'Accept' => 'application/json' ],
] );

$contractors = [];
$api_error   = false;

if ( is_wp_error( $response ) ) {
    $api_error = true;
} else {
    $body = wp_remote_retrieve_body( $response );
    $code = wp_remote_retrieve_response_code( $response );
    if ( $code === 200 && $body ) {
        $decoded = json_decode( $body, true );
        if ( isset( $decoded['contractors'] ) && is_array( $decoded['contractors'] ) ) {
            $contractors = $decoded['contractors'];
        } else {
            $api_error = true;
        }
    } else {
        $api_error = true;
    }
}

// Build location list for filter dropdown
$locations = array_unique( array_filter( array_column( $contractors, 'location' ) ) );
sort( $locations );

// JSON for JS renderer — sanitize here, not in JS
$sat_json = wp_json_encode( $contractors, JSON_HEX_TAG | JSON_HEX_QUOT );

sa_head( 'Browse Talent — StaffingAtlas' );
?>
<link rel="stylesheet" href="<?php echo esc_url( get_stylesheet_directory_uri() . '/sa-style.css' ); ?>">
<style>
/* ── Layout ────────────────────────────────────── */
.talent-wrap{display:flex;gap:32px;max-width:1180px;margin:0 auto;padding:40px 24px}
.filter-sidebar{width:260px;flex-shrink:0;position:sticky;top:88px;align-self:flex-start}
.filter-sidebar h3{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--navy);margin:0 0 16px}
.talent-main{flex:1;min-width:0}
.talent-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px}
.talent-header h1{font-size:28px;font-weight:800;color:var(--navy);margin:0}
.count-text{font-size:14px;color:#6b7280}

/* ── Filter card ───────────────────────────────── */
.filter-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px}
.filter-group{margin-bottom:20px}
.filter-group label{display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em}
.filter-group input[type=text],
.filter-group select{width:100%;padding:8px 10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;color:#111827;background:#fff;box-sizing:border-box}
.filter-group input[type=text]:focus,
.filter-group select:focus{outline:none;border-color:var(--navy)}
.filter-group input[type=range]{width:100%;accent-color:var(--amber)}
.range-labels{display:flex;justify-content:space-between;font-size:12px;color:#6b7280;margin-top:4px}
.filter-btn{width:100%;padding:10px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:background .2s}
.filter-btn.primary{background:var(--navy);color:#fff;margin-bottom:8px}
.filter-btn.primary:hover{background:var(--navy-deep)}
.filter-btn.secondary{background:#f3f4f6;color:#374151}
.filter-btn.secondary:hover{background:#e5e7eb}

/* ── Pool toggle ───────────────────────────────── */
.pool-toggle{display:flex;gap:8px;margin-bottom:20px}
.pool-toggle button{flex:1;padding:8px 0;border:1.5px solid #d1d5db;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;background:#fff;color:#6b7280;transition:all .2s}
.pool-toggle button.active{border-color:var(--navy);background:var(--navy);color:#fff}

/* ── Contractor cards ──────────────────────────── */
.cards-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px}
.contractor-card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:20px;transition:box-shadow .2s,transform .2s;cursor:default}
.contractor-card:hover{box-shadow:0 8px 24px rgba(27,58,107,.1);transform:translateY(-2px)}
.card-header{display:flex;align-items:center;gap:12px;margin-bottom:14px}
.card-avatar{width:48px;height:48px;border-radius:50%;object-fit:cover;background:#e5e7eb;flex-shrink:0}
.card-name{font-size:15px;font-weight:700;color:var(--navy);margin:0 0 2px}
.card-role{font-size:13px;color:#6b7280;margin:0}
.card-meta{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.meta-chip{font-size:12px;padding:3px 8px;border-radius:20px;font-weight:500}
.meta-chip.location{background:#eff6ff;color:#1d4ed8}
.meta-chip.avail{background:#f0fdf4;color:#15803d}
.meta-chip.rate{background:#fff7ed;color:#c2410c;font-weight:700}
.meta-chip.pool-vetted{background:#fef3c7;color:#92400e}
.meta-chip.pool-market{background:#f3f4f6;color:#374151}
.card-bio{font-size:13px;color:#4b5563;line-height:1.5;margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.card-skills{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:14px}
.skill-tag{font-size:11px;padding:2px 7px;background:#f3f4f6;color:#374151;border-radius:4px;font-weight:500}
.card-footer{display:flex;justify-content:flex-end}
.btn-contact{display:inline-block;background:var(--navy);color:#fff;padding:7px 16px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;transition:background .2s}
.btn-contact:hover{background:var(--navy-deep)}

/* ── Empty / error state ───────────────────────── */
.empty-state{text-align:center;padding:80px 24px}
.empty-state .icon{font-size:48px;margin-bottom:16px}
.empty-state h2{font-size:24px;font-weight:700;color:var(--navy);margin:0 0 8px}
.empty-state p{color:#6b7280;font-size:15px}

/* ── Hero banner ───────────────────────────────── */
.talent-hero{background:var(--navy);color:#fff;padding:64px 24px;text-align:center}
.talent-hero h1{font-size:40px;font-weight:800;margin:0 0 12px}
.talent-hero p{font-size:18px;opacity:.85;max-width:560px;margin:0 auto 28px}
.talent-hero .cta-row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.hero-btn{padding:13px 28px;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;transition:opacity .2s}
.hero-btn.primary{background:var(--amber);color:#fff}
.hero-btn.outline{border:2px solid rgba(255,255,255,.4);color:#fff}
.hero-btn:hover{opacity:.88}

@media(max-width:768px){
  .talent-wrap{flex-direction:column}
  .filter-sidebar{width:100%;position:static}
  .cards-grid{grid-template-columns:1fr}
  .talent-hero h1{font-size:28px}
}
</style>

<?php sa_header( 'talent' ); ?>

<div class="talent-hero">
  <h1>Find Your Offshore Talent</h1>
  <p>Pre-screened contractors from the Philippines, South Asia, and Latin America — ready to join your team.</p>
  <div class="cta-row">
    <a href="https://staffingatlas.online" class="hero-btn primary">Post a Role</a>
    <a href="/get-matched/" class="hero-btn outline">Get Matched by Us</a>
  </div>
</div>

<div class="talent-wrap">

  <!-- Filter Sidebar -->
  <aside class="filter-sidebar">
    <div class="filter-card">
      <h3>Filters</h3>

      <div class="pool-toggle" id="poolToggle">
        <button class="active" data-pool="">All</button>
        <button data-pool="vetted">Vetted</button>
        <button data-pool="marketplace">Open</button>
      </div>

      <div class="filter-group">
        <label>Search</label>
        <input type="text" id="searchInput" placeholder="Name, role, skill…">
      </div>

      <div class="filter-group">
        <label>Location</label>
        <select id="locationSelect">
          <option value="">All locations</option>
          <?php foreach ( $locations as $loc ) : ?>
            <option value="<?php echo esc_attr( $loc ); ?>"><?php echo esc_html( $loc ); ?></option>
          <?php endforeach; ?>
        </select>
      </div>

      <div class="filter-group">
        <label>Availability</label>
        <select id="availSelect">
          <option value="">Any</option>
          <option value="Full-time (40hr)">Full-time (40hr)</option>
          <option value="Part-time (20hr)">Part-time (20hr)</option>
          <option value="Flexible">Flexible</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Max Rate: <strong id="rateLabel">$100/hr</strong></label>
        <input type="range" id="rateSlider" min="0" max="100" value="100" step="5">
        <div class="range-labels"><span>$0</span><span>$100/hr</span></div>
      </div>

      <button class="filter-btn primary" onclick="applyFilters()">Apply Filters</button>
      <button class="filter-btn secondary" onclick="resetFilters()">Reset</button>
    </div>
  </aside>

  <!-- Main -->
  <main class="talent-main">
    <div class="talent-header">
      <h1>Talent Pool</h1>
      <span class="count-text" id="countText">Loading…</span>
    </div>

    <?php if ( $api_error ) : ?>
    <div class="empty-state">
      <div class="icon">⚡</div>
      <h2>Talent browse coming soon</h2>
      <p>Our talent database is being upgraded. <a href="/get-matched/">Get matched manually</a> in the meantime.</p>
    </div>
    <?php else : ?>
    <div class="cards-grid" id="cardGrid"></div>
    <div class="empty-state" id="noResults" style="display:none">
      <div class="icon">🔍</div>
      <h2>No matches found</h2>
      <p>Try adjusting your filters.</p>
    </div>
    <?php endif; ?>
  </main>

</div>

<?php sa_footer(); ?>

<?php if ( ! $api_error ) : ?>
<script>
(function(){
  var AVATAR_BASE = 'https://ui-avatars.com/api/?background=1B3A6B&color=fff&bold=true&size=96&name=';
  var ALL = <?php echo $sat_json; ?>;
  var activePool = '';

  function renderCard(c){
    var rate = c.rate_usd > 0 ? '$' + c.rate_usd + '/hr' : 'On request';
    var pool = c.pool_type === 'vetted' ? '<span class="meta-chip pool-vetted">Vetted</span>' : '<span class="meta-chip pool-market">Marketplace</span>';
    var bio  = c.bio ? '<p class="card-bio">' + esc(c.bio) + '</p>' : '';
    var skills = '';
    if (c.skills && c.skills.length) {
      var shown = c.skills.slice(0, 5);
      for (var i = 0; i < shown.length; i++) {
        skills += '<span class="skill-tag">' + esc(shown[i]) + '</span>';
      }
    }
    var avatar = c.photo_url ? esc(c.photo_url) : AVATAR_BASE + encodeURIComponent(c.display_name);
    return '<div class="contractor-card">' +
      '<div class="card-header">' +
        '<img class="card-avatar" src="' + avatar + '" alt="' + esc(c.display_name) + '">' +
        '<div>' +
          '<p class="card-name">' + esc(c.display_name) + '</p>' +
          '<p class="card-role">' + esc(c.role) + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="card-meta">' +
        '<span class="meta-chip location">' + esc(c.location) + '</span>' +
        '<span class="meta-chip avail">' + esc(c.availability) + '</span>' +
        '<span class="meta-chip rate">' + rate + '</span>' +
        pool +
      '</div>' +
      bio +
      '<div class="card-skills">' + skills + '</div>' +
      '<div class="card-footer">' +
        '<a class="btn-contact" href="https://staffingatlas.online/hire?ref=' + esc(c.id) + '">Contact</a>' +
      '</div>' +
    '</div>';
  }

  function esc(str){
    if (!str) return '';
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  function applyFilters(){
    var search   = document.getElementById('searchInput').value.toLowerCase();
    var location = document.getElementById('locationSelect').value;
    var avail    = document.getElementById('availSelect').value;
    var maxRate  = parseInt(document.getElementById('rateSlider').value);

    var filtered = [];
    for (var i = 0; i < ALL.length; i++) {
      var c = ALL[i];
      if (activePool && c.pool_type !== activePool) continue;
      if (location && c.location !== location) continue;
      if (avail && c.availability !== avail) continue;
      if (maxRate < 100 && c.rate_usd > 0 && c.rate_usd > maxRate) continue;
      if (search) {
        var haystack = [c.display_name, c.role, c.bio, (c.skills||[]).join(' ')].join(' ').toLowerCase();
        if (haystack.indexOf(search) === -1) continue;
      }
      filtered.push(c);
    }

    var grid = document.getElementById('cardGrid');
    var none = document.getElementById('noResults');
    var count = document.getElementById('countText');

    if (filtered.length === 0) {
      grid.innerHTML = '';
      none.style.display = '';
      count.textContent = '0 contractors found';
    } else {
      var html = '';
      for (var j = 0; j < filtered.length; j++) {
        html += renderCard(filtered[j]);
      }
      grid.innerHTML = html;
      none.style.display = 'none';
      count.textContent = filtered.length + ' contractor' + (filtered.length === 1 ? '' : 's') + ' found';
    }
  }

  function resetFilters(){
    document.getElementById('searchInput').value = '';
    document.getElementById('locationSelect').value = '';
    document.getElementById('availSelect').value = '';
    document.getElementById('rateSlider').value = 100;
    document.getElementById('rateLabel').textContent = '$100/hr';
    activePool = '';
    var btns = document.querySelectorAll('#poolToggle button');
    for (var i = 0; i < btns.length; i++) {
      btns[i].className = btns[i].getAttribute('data-pool') === '' ? 'active' : '';
    }
    applyFilters();
  }

  // Pool toggle
  document.getElementById('poolToggle').addEventListener('click', function(e){
    var btn = e.target.closest('button');
    if (!btn) return;
    activePool = btn.getAttribute('data-pool');
    var btns = document.querySelectorAll('#poolToggle button');
    for (var i = 0; i < btns.length; i++) {
      btns[i].className = btns[i].getAttribute('data-pool') === activePool ? 'active' : '';
    }
    applyFilters();
  });

  // Rate slider
  document.getElementById('rateSlider').addEventListener('input', function(){
    var val = parseInt(this.value);
    document.getElementById('rateLabel').textContent = val === 100 ? '$100/hr' : '$' + val + '/hr';
  });

  // Live search
  document.getElementById('searchInput').addEventListener('input', applyFilters);
  document.getElementById('locationSelect').addEventListener('change', applyFilters);
  document.getElementById('availSelect').addEventListener('change', applyFilters);
  document.getElementById('rateSlider').addEventListener('change', applyFilters);

  // Init
  applyFilters();
})();
</script>
<?php endif; ?>

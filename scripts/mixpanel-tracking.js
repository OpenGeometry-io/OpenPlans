/**
 * OpenPlans Mixpanel Tracking Script
 * This file is read by the Vite plugin and injected into HTML files during build.
 * It is NOT imported directly — the contents are inlined as a <script> tag.
 */

(function () {
    // --- Helpers ---
    function getPageType() {
        var path = window.location.pathname;
        if (path.endsWith('demo.html')) return 'demo';
        if (path.includes('/examples/')) return 'example';
        if (path.endsWith('index.html') || path.endsWith('/')) return 'index';
        return 'other';
    }

    function getExampleInfo() {
        var path = window.location.pathname;
        var match = path.match(/examples\/(.+?)\/([^/]+)\.html$/);
        if (match) return { category: match[1], name: match[2] };
        // Top-level example (e.g., examples/demo.html)
        var topMatch = path.match(/examples\/([^/]+)\.html$/);
        if (topMatch) return { category: 'general', name: topMatch[1] };
        return null;
    }

    // --- Init ---
    var TOKEN = 'bd6aba2564cbbae136d2f5e694fd6bff';
    mixpanel.init(TOKEN, {
        track_pageview: true,
        autocapture: true,
        persistence: 'localStorage',
        record_sessions_percent: 100,
        api_host: 'https://api-eu.mixpanel.com',
    });

    var pageType = getPageType();
    var exampleInfo = getExampleInfo();

    // --- Super Properties (attached to ALL events) ---
    mixpanel.register({
        page_type: pageType,
        referrer: document.referrer || 'direct',
        url: window.location.href
    });

    // --- Page Viewed ---
    mixpanel.track('Page Viewed', {
        page_type: pageType,
        page_title: document.title,
        referrer: document.referrer || 'direct',
        url: window.location.href
    });

    // --- Example Viewed ---
    if (pageType === 'example' && exampleInfo) {
        mixpanel.track('Example Viewed', {
            category: exampleInfo.category,
            example_name: exampleInfo.name
        });
    }

    // --- Demo Launched ---
    if (pageType === 'demo') {
        mixpanel.track('Demo Launched');
    }

    // --- Session Duration Tracking ---
    if (pageType === 'example' || pageType === 'demo') {
        var sessionEvent = pageType === 'demo' ? 'Demo Session' : 'Example Session';
        mixpanel.time_event(sessionEvent);

        window.addEventListener('beforeunload', function () {
            var props = { page_type: pageType };
            if (exampleInfo) {
                props.example_name = exampleInfo.name;
                props.category = exampleInfo.category;
            }
            mixpanel.track(sessionEvent, props);
        });
    }

    // --- Index Page Specific Events ---
    if (pageType === 'index') {
        // Filter button clicks
        document.addEventListener('click', function (e) {
            var filterBtn = e.target.closest('.filter-btn');
            if (filterBtn) {
                mixpanel.track('Filter Clicked', {
                    filter_name: filterBtn.getAttribute('data-filter') || filterBtn.textContent.trim()
                });
                return;
            }

            // Example card clicks
            var cardLink = e.target.closest('.card-link');
            if (cardLink) {
                var card = cardLink.closest('.card');
                if (card) {
                    var titleEl = card.querySelector('.card-title');
                    var tagEl = card.querySelector('.card-tag');
                    mixpanel.track('Example Card Clicked', {
                        example_name: titleEl ? titleEl.textContent.trim() : 'unknown',
                        category: tagEl ? tagEl.textContent.trim() : 'unknown',
                        link_url: cardLink.getAttribute('href') || ''
                    });
                }
                return;
            }
        });
    }

    // --- External & GitHub Link Tracking (all pages) ---
    document.addEventListener('click', function (e) {
        var link = e.target.closest('a[href]');
        if (!link) return;

        var href = link.getAttribute('href') || '';

        // GitHub link
        if (href.includes('github.com')) {
            mixpanel.track('GitHub Link Clicked', {
                link_url: href,
                link_text: link.textContent.trim()
            });
            return;
        }

        // External links
        if (href.startsWith('http') && !href.includes(window.location.hostname)) {
            mixpanel.track('External Link Clicked', {
                link_url: href,
                link_text: link.textContent.trim()
            });
        }
    });
})();

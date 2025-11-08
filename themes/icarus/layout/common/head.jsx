const { Component } = require('inferno');
const MetaTags = require('hexo-component-inferno/lib/view/misc/meta');
const WebApp = require('hexo-component-inferno/lib/view/misc/web_app');
const OpenGraph = require('hexo-component-inferno/lib/view/misc/open_graph');
const StructuredData = require('hexo-component-inferno/lib/view/misc/structured_data');
const Plugins = require('./plugins');

function getPageTitle(page, siteTitle, helper) {
    let title = page.title;

    if (helper.is_archive()) {
        title = helper._p('common.archive', Infinity);
        if (helper.is_month()) {
            title += ': ' + page.year + '/' + page.month;
        } else if (helper.is_year()) {
            title += ': ' + page.year;
        }
    } else if (helper.is_category()) {
        title = helper._p('common.category', 1) + ': ' + page.category;
    } else if (helper.is_tag()) {
        title = helper._p('common.tag', 1) + ': ' + page.tag;
    } else if (helper.is_categories()) {
        title = helper._p('common.category', Infinity);
    } else if (helper.is_tags()) {
        title = helper._p('common.tag', Infinity);
    }

    return [title, siteTitle].filter(str => typeof str !== 'undefined' && str.trim() !== '').join(' - ');
}

module.exports = class extends Component {
    render() {
        const { site, config, helper, page } = this.props;
        const { url_for, cdn, fontcdn, iconcdn, is_post } = helper;
        const {
            url,
            head = {},
            article,
            highlight,
            variant = 'default'
        } = config;
        const {
            meta = [],
            manifest = {},
            open_graph = {},
            structured_data = {},
            canonical_url = page.permalink,
            rss,
            favicon
        } = head;

        const noIndex = helper.is_archive() || helper.is_category() || helper.is_tag();

        const language = page.lang || page.language || config.language;
        const fontCssUrl = {
            default: fontcdn('Ubuntu:wght@400;600&family=Source+Code+Pro', 'css2'),
            cyberpunk: fontcdn('Oxanium:wght@300;400;600&family=Roboto+Mono', 'css2')
        };

        let hlTheme, images;
        if (highlight && highlight.enable === false) {
            hlTheme = null;
        } else if (article && article.highlight && article.highlight.theme) {
            hlTheme = article.highlight.theme;
        } else {
            hlTheme = 'atom-one-light';
        }

        if (typeof page.og_image === 'string') {
            images = [page.og_image];
        } else if (typeof page.cover === 'string') {
            images = [url_for(page.cover)];
        } else if (typeof page.thumbnail === 'string') {
            images = [url_for(page.thumbnail)];
        } else if (article && typeof article.og_image === 'string') {
            images = [article.og_image];
        } else if (page.content && page.content.includes('<img')) {
            let img;
            images = [];
            const imgPattern = /<img [^>]*src=['"]([^'"]+)([^>]*>)/gi;
            while ((img = imgPattern.exec(page.content)) !== null) {
                images.push(img[1]);
            }
        } else {
            images = [url_for('/img/og_image.png')];
        }

        let adsenseClientId = null;
        if (Array.isArray(config.widgets)) {
            const widget = config.widgets.find(widget => widget.type === 'adsense');
            if (widget) {
                adsenseClientId = widget.client_id;
            }
        }

        let openGraphImages = images;
        if ((typeof open_graph === 'object' && open_graph !== null)
            && ((Array.isArray(open_graph.image) && open_graph.image.length > 0) || typeof open_graph.image === 'string')) {
            openGraphImages = open_graph.image;
        } else if ((Array.isArray(page.photos) && page.photos.length > 0) || typeof page.photos === 'string') {
            openGraphImages = page.photos;
        }

        let structuredImages = images;
        if ((typeof structured_data === 'object' && structured_data !== null)
            && ((Array.isArray(structured_data.image) && structured_data.image.length > 0) || typeof structured_data.image === 'string')) {
            structuredImages = structured_data.image;
        } else if ((Array.isArray(page.photos) && page.photos.length > 0) || typeof page.photos === 'string') {
            structuredImages = page.photos;
        }

        let followItVerificationCode = null;
        if (Array.isArray(config.widgets)) {
            const widget = config.widgets.find(widget => widget.type === 'followit');
            if (widget) {
                followItVerificationCode = widget.verification_code;
            }
        }

        return <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
            {noIndex ? <meta name="robots" content="noindex" /> : null}
            {meta && meta.length ? <MetaTags meta={meta} /> : null}

            <title>{getPageTitle(page, config.title, helper)}</title>

            <WebApp.Cacheable
                helper={helper}
                favicon={favicon}
                icons={manifest.icons}
                themeColor={manifest.theme_color}
                name={manifest.name || config.title} />

            {typeof open_graph === 'object' && open_graph !== null ? <OpenGraph
                type={open_graph.type || (is_post(page) ? 'article' : 'website')}
                title={open_graph.title || page.title || config.title}
                date={page.date}
                updated={page.updated}
                author={open_graph.author || config.author}
                description={open_graph.description || page.description || page.excerpt || page.content || config.description}
                keywords={(page.tags && page.tags.length ? page.tags : undefined) || config.keywords}
                url={open_graph.url || page.permalink || url}
                images={openGraphImages}
                siteName={open_graph.site_name || config.title}
                language={language}
                twitterId={open_graph.twitter_id}
                twitterCard={open_graph.twitter_card}
                twitterSite={open_graph.twitter_site}
                googlePlus={open_graph.google_plus}
                facebookAdmins={open_graph.fb_admins}
                facebookAppId={open_graph.fb_app_id} /> : null}

            {typeof structured_data === 'object' && structured_data !== null ? <StructuredData
                title={structured_data.title || page.title || config.title}
                description={structured_data.description || page.description || page.excerpt || page.content || config.description}
                url={structured_data.url || page.permalink || url}
                author={structured_data.author || config.author}
                publisher={structured_data.publisher || config.title}
                publisherLogo={structured_data.publisher_logo || config.logo}
                date={page.date}
                updated={page.updated}
                images={structuredImages} /> : null}

            {canonical_url ? <link rel="canonical" href={canonical_url} /> : null}
            {rss ? <link rel="alternate" href={url_for(rss)} title={config.title} type="application/atom+xml" /> : null}
            {favicon ? <link rel="icon" href={url_for(favicon)} /> : null}
            <link rel="stylesheet" href={iconcdn()} />
            {hlTheme ? <link data-pjax rel="stylesheet" href={cdn('highlight.js', '11.7.0', 'styles/' + hlTheme + '.css')} /> : null}
            <link rel="stylesheet" href={fontCssUrl[variant]} />
            <link data-pjax rel="stylesheet" href={url_for('/css/' + variant + '.css')} />
            {/* Inline dark mode styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                /* Add smooth transition for theme changes */
                html, body, .card, .navbar-main, .footer, a, .content, .title, p, h1, h2, h3, h4, h5, h6, span {
                    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
                }
                
                /* Dark mode base styles */
                .dark-mode { background: #0d1117; color: #c9d1d9; }
                .dark-mode body { background: #0d1117; color: #c9d1d9; }
                .dark-mode .navbar-main { background: #161b22; border-bottom: 1px solid #30363d; }
                .dark-mode .card { background: #161b22; border: 1px solid #30363d; color: #c9d1d9; }
                .dark-mode .footer { background: #161b22; border-top: 1px solid #30363d; color: #c9d1d9; }
                
                /* Dark mode link colors - bright blue for better visibility */
                .dark-mode a { color: #58a6ff; }
                .dark-mode a:hover { color: #79c0ff; }
                
                /* Dark mode text colors - ensure all text is visible */
                .dark-mode .content { color: #c9d1d9; }
                .dark-mode .title { color: #e6eef8; }
                .dark-mode .subtitle { color: #c9d1d9; }
                .dark-mode p, .dark-mode span, .dark-mode div { color: #c9d1d9; }
                .dark-mode h1, .dark-mode h2, .dark-mode h3, .dark-mode h4, .dark-mode h5, .dark-mode h6 { color: #e6eef8; }
                
                /* Widget and card text */
                .dark-mode .widget .menu-label { color: #e6eef8; }
                .dark-mode .widget .heading { color: #8b949e; }
                .dark-mode .card-header-title { color: #e6eef8; }
                .dark-mode .card-content { color: #c9d1d9; }
                
                /* Navbar items */
                .dark-mode .navbar-item { color: #c9d1d9; }
                .dark-mode .navbar-item:hover { color: #e6eef8; background-color: rgba(48, 54, 61, 0.5); }
                .dark-mode .navbar-item.is-active { 
                    color: #58a6ff; 
                    background-color: rgba(48, 54, 61, 0.5);
                    border-bottom: 2px solid #58a6ff;
                }
                
                /* Metadata and dates */
                .dark-mode .date, .dark-mode .categories, .dark-mode .is-size-7 { color: #8b949e; }
                
                /* Photography title/link adjustments */
                .card .title a.has-link-black-ter { color: #111; transition: color 0.18s ease, transform 0.12s ease; }
                .card .title a.has-link-black-ter:hover { transform: translateY(-2px); }
                .dark-mode .card .title a.has-link-black-ter { color: #e6eef8; }
                .dark-mode .card .title a.has-link-black-ter:hover { color: #58a6ff; }
                
                /* Post title styling - blue by default, white/black on hover, no animation */
                .card .title a,
                .card .title a.link-muted {
                    color: #58a6ff !important;
                    transition: color 0.2s ease;
                    transform: none !important;
                }
                .card .title a:hover,
                .card .title a.link-muted:hover {
                    color: #111 !important;
                    transform: none !important;
                }
                .dark-mode .card .title a,
                .dark-mode .card .title a.link-muted {
                    color: #58a6ff !important;
                }
                .dark-mode .card .title a:hover,
                .dark-mode .card .title a.link-muted:hover {
                    color: #fff !important;
                }
                
                /* Make post titles smaller */
                .card .title.is-3 {
                    font-size: 1.5rem !important;
                }
                .card .title.is-3.is-size-4-mobile {
                    font-size: 1.25rem !important;
                }
                @media screen and (max-width: 768px) {
                    .card .title.is-3.is-size-4-mobile {
                        font-size: 1.1rem !important;
                    }
                }
                
                /* Make page headings (Blogs, Photography, etc.) bigger */
                .card-content > .title.is-3:first-child,
                .content > .title.is-3:first-child {
                    font-size: 2.25rem !important;
                }
                
                /* Center share buttons */
                .a2a_kit {
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                }
                
                /* Post card separator line - lighter gray */
                .card-content hr,
                .content hr {
                    background-color: #e0e0e0;
                    border: none;
                    height: 1px;
                }
                .dark-mode .card-content hr,
                .dark-mode .content hr {
                    background-color: #3a3a3a;
                }
                
                /* Buttons and inputs */
                .dark-mode .button { background: #21262d; color: #c9d1d9; border-color: #30363d; }
                .dark-mode .button:hover { background: #30363d; color: #e6eef8; }
                .dark-mode input, .dark-mode textarea { background: #0d1117; color: #c9d1d9; border-color: #30363d; }
                .dark-mode input::placeholder, .dark-mode textarea::placeholder { color: #8b949e; }
                
                /* Tags and labels */
                .dark-mode .tag { background: #21262d; color: #c9d1d9; }
                .dark-mode .menu-list a { color: #c9d1d9; }
                .dark-mode .menu-list a:hover { background: #21262d; color: #e6eef8; }
                
                /* Notifications and messages */
                .dark-mode .notification { background: #161b22; color: #c9d1d9; }
                .dark-mode code { background: #21262d; color: #ff7b72; }
                .dark-mode pre { background: #161b22; color: #c9d1d9; }
                
                /* Timeline (archives page) */
                .dark-mode .timeline { border-left-color: #30363d; }
                .dark-mode .timeline .media:before { background: #30363d; }
                .dark-mode .timeline .media:last-child:after { background: #161b22; }
                
                /* Read more button and muted links */
                .dark-mode .article-more { 
                    background: #21262d !important; 
                    color: #58a6ff !important; 
                    border-color: #30363d !important; 
                }
                .dark-mode .article-more:hover { 
                    background: #30363d !important; 
                    color: #79c0ff !important;
                    border-color: #58a6ff !important;
                }
                .dark-mode .article-more .has-text-grey {
                    color: #8b949e !important;
                }
                .dark-mode .link-muted { color: #8b949e; }
                .dark-mode .link-muted:hover { color: #58a6ff; }
                
                /* Article navigation links */
                .dark-mode .article-nav-prev, .dark-mode .article-nav-next {
                    color: #8b949e;
                }
                .dark-mode .article-nav-prev:hover, .dark-mode .article-nav-next:hover {
                    color: #58a6ff;
                }
                
                /* Code blocks in dark mode */
                .dark-mode figure.highlight {
                    background: #1e1e1e !important;
                    border: 1px solid #404040 !important;
                }
                .dark-mode figure.highlight pre {
                    background: #1e1e1e !important;
                    color: #d4d4d4 !important;
                }
                .dark-mode figure.highlight code {
                    background: #1e1e1e !important;
                    color: #d4d4d4 !important;
                }
                .dark-mode figure.highlight figcaption {
                    background: #2d2d2d !important;
                    color: #cccccc !important;
                    border-bottom: 1px solid #404040;
                }
                .dark-mode figure.highlight .gutter {
                    background: #2d2d2d !important;
                    color: #858585 !important;
                }
                .dark-mode figure.highlight .gutter pre {
                    color: #858585 !important;
                }
                .dark-mode figure.highlight table {
                    background: #1e1e1e !important;
                }
                
                /* Inline code in dark mode */
                .dark-mode .content code:not(.hljs) {
                    background: #2d2d2d !important;
                    color: #f8f8f2 !important;
                }
                
                /* Article licensing in dark mode */
                .dark-mode .article-licensing {
                    background: #21262d !important;
                    border: 1px solid #30363d !important;
                }
                .dark-mode .article-licensing .licensing-title,
                .dark-mode .article-licensing .licensing-title p {
                    color: #e6eef8 !important;
                }
                .dark-mode .article-licensing h6 {
                    color: #8b949e !important;
                }
                .dark-mode .article-licensing p {
                    color: #c9d1d9 !important;
                }
                .dark-mode .article-licensing a {
                    color: #58a6ff !important;
                }
                
                /* Remove button box borders in dark mode */
                .dark-mode .button.is-transparent {
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                }
                .dark-mode .level-item.button {
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                }
            ` }} />
            <Plugins site={site} config={config} helper={helper} page={page} head={true} />

            {adsenseClientId ? <script data-ad-client={adsenseClientId}
                src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js" async></script> : null}

            {followItVerificationCode ? <meta name="follow.it-verification-code" content={followItVerificationCode} /> : null}
        </head>;
    }
};

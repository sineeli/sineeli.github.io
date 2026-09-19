/**
 * Self-hosted share buttons that don't depend on any third-party script,
 * so they always render (unlike widgets such as AddToAny that can be
 * blocked by ad blockers or fail to load, leaving empty placeholder boxes).
 */
const { Fragment } = require('inferno');
const { cacheComponent } = require('hexo-component-inferno/lib/util/cache');

const BUTTONS = [
    {
        name: 'LinkedIn',
        icon: 'fab fa-linkedin-in',
        url: (url, title) => `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
    },
    {
        name: 'Reddit',
        icon: 'fab fa-reddit-alien',
        url: (url, title) => `https://www.reddit.com/submit?url=${url}&title=${title}`
    },
    {
        name: 'Email',
        icon: 'fas fa-envelope',
        url: (url, title) => `mailto:?subject=${title}&body=${url}`
    },
    {
        name: 'Facebook',
        icon: 'fab fa-facebook-f',
        url: (url, title) => `https://www.facebook.com/sharer/sharer.php?u=${url}`
    },
    {
        name: 'X (Twitter)',
        icon: 'fab fa-twitter',
        url: (url, title) => `https://twitter.com/intent/tweet?url=${url}&text=${title}`
    },
    {
        name: 'Telegram',
        icon: 'fab fa-telegram-plane',
        url: (url, title) => `https://t.me/share/url?url=${url}&text=${title}`
    },
    {
        name: 'WhatsApp',
        icon: 'fab fa-whatsapp',
        url: (url, title) => `https://wa.me/?text=${title}%20${url}`
    }
];

function Share(props) {
    const { pageUrl, pageTitle } = props;
    const url = encodeURIComponent(pageUrl || '');
    const title = encodeURIComponent(pageTitle || '');

    return <Fragment>
        <div class="field has-addons share-buttons">
            {BUTTONS.map(button => <p class="control">
                <a
                    class="button is-transparent is-large"
                    target="_blank"
                    rel="noopener"
                    title={`Share on ${button.name}`}
                    href={button.url(url, title)}
                >
                    <i class={button.icon}></i>
                </a>
            </p>)}
        </div>
    </Fragment>;
}

Share.Cacheable = cacheComponent(Share, 'share.simple', (props) => {
    const { page, helper } = props;
    const { url_for } = helper;
    return {
        pageUrl: page && page.permalink ? page.permalink : url_for(page ? page.path : '/'),
        pageTitle: page ? page.title : ''
    };
});

module.exports = Share;

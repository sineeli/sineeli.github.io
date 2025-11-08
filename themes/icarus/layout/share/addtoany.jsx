/**
 * AddToAny share buttons JSX component without defer.
 * @module view/share/addtoany
 */
const { Component, Fragment } = require('inferno');
const { cacheComponent } = require('hexo-component-inferno/lib/util/cache');

/**
 * AddToAny share buttons JSX component.
 *
 * @see https://www.addtoany.com/buttons/
 * @example
 * <AddToAny />
 */
class AddToAny extends Component {
    componentDidMount() {
        // Initialize AddToAny after component mounts
        if (typeof window !== 'undefined' && window.a2a) {
            window.a2a.init_all();
        }
    }

    componentDidUpdate() {
        // Reinitialize when component updates
        if (typeof window !== 'undefined' && window.a2a) {
            window.a2a.init_all();
        }
    }

    render() {
        return <Fragment>
            <div class="a2a_kit a2a_kit_size_32 a2a_default_style" data-a2a-url="" data-a2a-title="">
                <a class="a2a_button_linkedin"></a>
                <a class="a2a_button_reddit"></a>
                <a class="a2a_button_email"></a>
                <a class="a2a_button_facebook"></a>
                <a class="a2a_button_twitter"></a>
                <a class="a2a_button_telegram"></a>
                <a class="a2a_button_whatsapp"></a>
                <a class="a2a_dd" target="_blank" rel="noopener" href="https://www.addtoany.com/share"></a>
            </div>
            <script dangerouslySetInnerHTML={{
                __html: `
                    (function() {
                        if (!window.a2aScriptLoaded) {
                            window.a2aScriptLoaded = true;
                            var script = document.createElement('script');
                            script.async = true;
                            script.src = 'https://static.addtoany.com/menu/page.js';
                            document.head.appendChild(script);
                        } else if (window.a2a) {
                            window.a2a.init_all();
                        }
                    })();
                `
            }} />
        </Fragment>;
    }
}

/**
 * Cacheable AddToAny share buttons JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <AddToAny.Cacheable />
 */
AddToAny.Cacheable = cacheComponent(AddToAny, 'share.addtoany', (props) => {
    return {};
});

module.exports = AddToAny;

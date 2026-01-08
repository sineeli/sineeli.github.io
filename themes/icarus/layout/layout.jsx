const { Component } = require('inferno');
const classname = require('hexo-component-inferno/lib/util/classname');
const Head = require('./common/head');
const Navbar = require('./common/navbar');
const Widgets = require('./common/widgets');
const Footer = require('./common/footer');
const Scripts = require('./common/scripts');
const Search = require('./common/search');

module.exports = class extends Component {
    render() {
        const { site, config, page, helper, body } = this.props;

        const language = page.lang || page.language || config.language;
        const widgetList = Array.isArray(config.widgets) ? config.widgets : [];
        const hasLeftWidgets = widgetList.some(widget => widget && widget.position === 'left');
        const hasRightWidgets = widgetList.some(widget => widget && widget.position === 'right');
        const bodyColumnCount = (hasLeftWidgets ? 1 : 0) + (hasRightWidgets ? 1 : 0) + 1;
        let layoutColumnCount = bodyColumnCount;

        const isPost = page.layout === 'post';
        const showToc = config.toc === true && ['page', 'post'].includes(page.layout) && page.toc !== false;
        const isCenteredContent = isPost && showToc;
        const hasLeftToc = isPost && showToc;

        if (isPost) {
            if (showToc) {
                // Has TOC - show left sidebar and center content
                layoutColumnCount = 2;
            } else {
                // No TOC - full width content
                layoutColumnCount = 1;
            }
        }

        return <html lang={language ? language.substr(0, 2) : ''}>
            <Head site={site} config={config} helper={helper} page={page} />
            <body class={`is-${bodyColumnCount}-column`}>
                <Navbar config={config} helper={helper} page={page} />
                <section class="section">
                    <div class="container">
                        <div class={classname({
                            columns: true,
                            'is-centered': isCenteredContent
                        })}>
                            <div class={classname({
                                column: true,
                                'order-2': true,
                                'column-main': true,
                                'is-12': layoutColumnCount === 1 && !isCenteredContent,
                                'is-12-tablet is-10-desktop is-10-widescreen': isCenteredContent,
                                'is-8-tablet is-8-desktop is-9-widescreen': hasLeftToc,
                                'is-8-tablet is-8-desktop is-8-widescreen': layoutColumnCount === 2 && !hasLeftToc && !isCenteredContent,
                                'is-8-tablet is-8-desktop is-6-widescreen': layoutColumnCount === 3
                            })} dangerouslySetInnerHTML={{ __html: body }}></div>
                            <Widgets site={site} config={config} helper={helper} page={page} position={'left'} />
                            <Widgets site={site} config={config} helper={helper} page={page} position={'right'} />
                        </div>
                    </div>
                </section>
                <Footer config={config} helper={helper} />
                <Scripts site={site} config={config} helper={helper} page={page} />
                <Search config={config} helper={helper} />
            </body>
        </html>;
    }
};

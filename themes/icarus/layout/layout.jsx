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
        let columnCount = Widgets.getColumnCount(config.widgets, config, page);
        
        // Check if TOC should be shown for this page
        const showToc = (config.toc === true) && ['page', 'post'].includes(page.layout) && page.toc !== false;
        
        // Adjust column count for post pages (show only left sidebar with TOC)
        let isPostWithLeftSidebar = false;
        let isCentered = false;
        
        if (page.layout === 'post') {
            if (showToc) {
                // Has TOC - show left sidebar
                columnCount = 2;
                isPostWithLeftSidebar = true;
            } else {
                // No TOC - center content
                columnCount = 1;
                isCentered = true;
            }
        }

        return <html lang={language ? language.substr(0, 2) : ''}>
            <Head site={site} config={config} helper={helper} page={page} />
            <body class={`is-${columnCount}-column`}>
                <Navbar config={config} helper={helper} page={page} />
                <section class="section">
                    <div class="container">
                        <div class={classname({
                            columns: true,
                            'is-centered': isCentered
                        })}>
                            <div class={classname({
                                column: true,
                                'order-2': true,
                                'column-main': true,
                                'is-12': columnCount === 1 && !isCentered,
                                'is-10-tablet is-8-desktop is-8-widescreen': isCentered,
                                'is-8-tablet is-8-desktop is-9-widescreen': isPostWithLeftSidebar,
                                'is-8-tablet is-8-desktop is-8-widescreen': columnCount === 2 && !isPostWithLeftSidebar && !isCentered,
                                'is-8-tablet is-8-desktop is-6-widescreen': columnCount === 3
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


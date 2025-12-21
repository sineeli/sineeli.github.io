const { Component } = require('inferno');
const CategoryPosts = require('./common/category-posts');

module.exports = class extends Component {
    render() {
        const { site, helper, config, page } = this.props;

        return <CategoryPosts 
            site={site}
            helper={helper}
            config={config}
            categoryName="gaming"
            pageTitle="Gaming"
            emptyMessage="No gaming posts yet."
        />;
    }
};

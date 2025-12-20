const { Component, Fragment } = require('inferno');
const PostCard = require('./post-card');

/**
 * Reusable component to display posts filtered by category or tag
 * @param {string} categoryName - The category/tag name to filter by
 * @param {string} emptyMessage - Message to show when no posts found
 */
module.exports = class CategoryPosts extends Component {
    render() {
        const { site, helper, config, categoryName, emptyMessage } = this.props;

        // collect posts array
        let allPosts = [];
        if (site && site.posts) {
            if (typeof site.posts.toArray === 'function') {
                allPosts = site.posts.toArray();
            } else if (Array.isArray(site.posts)) {
                allPosts = site.posts;
            }
        }

        // filter posts by category or tag
        const filteredPosts = allPosts.filter(p => {
            try {
                const cats = (p.categories || []).map(c => (c && (c.name || c)).toString().toLowerCase());
                const tags = (p.tags || []).map(t => (t && (t.name || t)).toString().toLowerCase());
                return cats.includes(categoryName.toLowerCase()) || tags.includes(categoryName.toLowerCase());
            } catch (e) {
                return false;
            }
        });

        // Sort posts by date (newest first)
        filteredPosts.sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : new Date(0);
            const dateB = b.date ? new Date(b.date) : new Date(0);
            return dateB - dateA;
        });

        return <Fragment>
            {filteredPosts.length ? filteredPosts.map(post => (
                <PostCard 
                    key={post.path}
                    config={config}
                    page={post}
                    helper={helper}
                />
            )) : <div class="card">
                <div class="card-content">
                    <p>{emptyMessage || `No ${categoryName} posts yet.`}</p>
                </div>
            </div>}
        </Fragment>;
    }
};

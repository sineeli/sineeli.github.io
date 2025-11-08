const { Component, Fragment } = require('inferno');
const PostCard = require('./common/post-card');

module.exports = class extends Component {
    render() {
    const { site, helper, page } = this.props;
    const { url_for, date, date_xml } = helper;

        // collect posts array
        let allPosts = [];
        if (site && site.posts) {
            if (typeof site.posts.toArray === 'function') {
                allPosts = site.posts.toArray();
            } else if (Array.isArray(site.posts)) {
                allPosts = site.posts;
            }
        }

        // filter posts that are blogs (category or tag)
        const photosPosts = allPosts.filter(p => {
            try {
                const cats = (p.categories || []).map(c => (c && (c.name || c)).toString().toLowerCase());
                const tags = (p.tags || []).map(t => (t && (t.name || t)).toString().toLowerCase());
                return cats.includes('blogs') || tags.includes('blogs');
            } catch (e) {
                return false;
            }
        });

        return <Fragment>
            {photosPosts.length ? photosPosts.map(post => (
                <PostCard 
                    key={post.path}
                    config={this.props.config}
                    page={post}
                    helper={helper}
                />
            )) : <div class="card">
                <div class="card-content">
                    <p>No blogs posts yet.</p>
                </div>
            </div>}
        </Fragment>;
    }
};

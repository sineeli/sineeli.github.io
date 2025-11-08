const { Component, Fragment } = require('inferno');
const ArticleMedia = require('hexo-component-inferno/lib/view/common/article_media');
const Paginator = require('hexo-component-inferno/lib/view/misc/paginator');
const PostCard = require('./common/post-card');

module.exports = class extends Component {
    renderAboutMe() {
        return <div class="card">
            <div class="card-content">
                <div class="content">
                    <h2 class="title is-4">Siva Sravana Kumar Neeli</h2>
                    <figure class="image mb-4" style="max-width: 600px; margin: 0 auto;">
                        <img src="/img/me.png" alt="Siva Sravana Kumar Neeli" style="width: 100%; height: auto; object-fit: cover; border-radius: 8px; display: block;" />
                        <figcaption class="is-size-7 has-text-grey mt-2 has-text-centered">in NYC Central Park</figcaption>
                    </figure>
                    <h2 class="title is-5">About Me</h2>
                    <p>
                        My name is Siva Sravana Kumar Neeli, and I am Senior ML Engineer at Blue Yonder. My expertise lies in the intersection of Data Science and Engineering. I love to build scalable solution in the ML space.
                    </p>

                    <p>It can be challenging to keep up with the latest advancements in AI and ML, but I enjoy the process of continuous learning and experimentation.</p>
                    <p>
                        When I'm not coding, you'll find me watching anime (huge One Piece fan!), traveling, and clicking photos along 
                        the way. I share my travel photography on Instagram at <a href="https://www.instagram.com/neelisverse/" target="_blank" rel="noopener">@neelisverse</a>. 
                        I love exploring new places and capturing moments through my lens.
                    </p>
                    <p>
                        Feel free to connect with me on <a href="https://www.linkedin.com/in/sravananeeli/" target="_blank" rel="noopener">LinkedIn</a> or 
                        check out my projects on <a href="https://github.com/sineeli" target="_blank" rel="noopener">GitHub</a>.
                    </p>
                </div>
            </div>
        </div>;
    }

    renderPosts() {
        const { config, page, helper } = this.props;
        const { url_for, __ } = helper;

        return <Fragment>
            {page.posts.map(post => (
                <PostCard 
                    key={post.path}
                    config={config}
                    page={post}
                    helper={helper}
                />
            ))}
            {page.total > 1 ? <Paginator
                current={page.current}
                total={page.total}
                baseUrl={page.base}
                path={config.pagination_dir}
                urlFor={url_for}
                prevTitle={__('common.prev')}
                nextTitle={__('common.next')} /> : null}
        </Fragment>;
    }

    render() {
        const { page } = this.props;
        
        // If this is a category/tag page with posts, render the posts
        // Otherwise (home page), render About Me
        if (page.posts && page.posts.length > 0 && (page.category || page.tag)) {
            return this.renderPosts();
        }
        
        return this.renderAboutMe();
    }
};

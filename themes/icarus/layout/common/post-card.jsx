const { Component } = require('inferno');

class PostCard extends Component {
    render() {
        const { config, page, helper } = this.props;
        const { url_for, date, date_xml, __ } = helper;

        // Get category info
        const firstCat = page.categories && page.categories.length > 0 ? page.categories.data[0] : null;
        const catName = firstCat ? firstCat.name : 'Uncategorized';
        const catPath = firstCat ? firstCat.path : '/';

        return (
            <div class="card" style={{
                marginBottom: '1.5rem',
                transition: 'opacity 0.3s ease-out, transform 0.3s ease-out, box-shadow 0.3s ease-in-out',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}>
                <article class="card-content article" role="article">
                    <h1 class="title is-size-3" style={{
                        fontFamily: "'PT Sans Narrow', sans-serif",
                        transition: 'color 0.2s ease, transform 0.15s ease'
                    }}>
                        <a class="has-link-black-ter" href={url_for(page.path)} style={{display: 'inline-block'}}>
                            {page.title}
                        </a>
                    </h1>
                    
                    <div class="article-meta is-size-7 is-uppercase level is-mobile">
                        <div class="level-left" style={{marginBottom: '0.5rem'}}>
                            {page.date && (
                                <span class="level-item">
                                    <i class="far fa-calendar-alt">&nbsp;</i>
                                    <time dateTime={date_xml(page.date)} title={date_xml(page.date)}>
                                        {date(page.date)}
                                    </time>
                                </span>
                            )}
                            <span class="level-item">
                                <i class="far fa-folder-open has-text-grey"></i>&nbsp;
                                <a class="link-muted" href={url_for(catPath)}>{catName}</a>
                            </span>
                        </div>
                    </div>

                    {(page.excerpt || page.more) && (
                        <div class="content" style={{marginTop: '1.0rem'}} 
                             dangerouslySetInnerHTML={{ __html: page.excerpt || '' }}>
                        </div>
                    )}

                    <hr style={{height: '1px', margin: '1rem 0'}} />

                    <div class="level is-mobile is-flex">
                        <div class="article-tags is-size-7 is-uppercase" style={{flex: '1'}}>
                            {page.tags && page.tags.length > 0 && (
                                <>
                                    <i class="fas fa-tags has-text-grey"></i>&nbsp;
                                    {page.tags.map((tag, i) => (
                                        <span key={i}>
                                            <a class="link-muted" rel="tag" href={url_for(tag.path)}>
                                                {tag.name}
                                            </a>
                                            {i < page.tags.length - 1 ? ', ' : ''}&nbsp;
                                        </span>
                                    ))}
                                </>
                            )}
                        </div>
                        <a class="article-more button is-small is-size-7" href={`${url_for(page.path)}#more`}>
                            <i class="fas fa-book-reader has-text-grey"></i>&nbsp;&nbsp;Read More
                        </a>
                    </div>
                </article>
            </div>
        );
    }
}

module.exports = PostCard;

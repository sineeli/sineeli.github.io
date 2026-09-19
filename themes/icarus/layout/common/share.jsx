const { Component } = require('inferno');
const SimpleShare = require('../share/simple');

// Self-hosted share buttons (see ../share/simple.jsx) are always used instead
// of the config-driven third-party widgets (AddToAny, ShareThis, etc.), which
// depend on an external script that ad blockers commonly block, leaving
// empty placeholder boxes in the article footer.
module.exports = class extends Component {
    render() {
        const { config, page, helper } = this.props;
        const Share = SimpleShare.Cacheable;
        return <Share config={config} page={page} helper={helper} />;
    }
};

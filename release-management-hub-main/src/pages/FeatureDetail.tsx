import { useNavigate, useParams } from 'react-router-dom';
import { useFeatureStore } from '@/components/FeatureStore';
import { formatDate } from '@/data/features';

const FeatureDetail = () => {
  const { featureId } = useParams();
  const navigate = useNavigate();
  const { byId, visibleFeatures, isCreator, toast } = useFeatureStore();
  const feature = featureId ? byId(featureId) : undefined;

  // A draft is only the creator's to see; anyone else lands back on the hub.
  if (!feature || (!feature.published && !isCreator)) {
    return (
      <div className="empty">
        <div className="ico"><i className="ph ph-magnifying-glass" /></div>
        <h4>That feature isn't available</h4>
        <p>It may have been removed, or it hasn't been published yet.</p>
        <button className="btn btn-ghost" onClick={() => navigate('/release-hub')}>
          <i className="ph ph-arrow-right" />Back to the Release Hub
        </button>
      </div>
    );
  }

  const openRes = (label: string, url?: string) =>
    toast(url ? `${label} → ${url}` : `${label} not attached to this feature.`, 'info');

  const [summary, ...rest] = (feature.summary || '').split('\n');
  const more = rest.join(' ');
  const inRelease = visibleFeatures.filter((f) => f.releaseMonth === feature.releaseMonth).length;

  const statusTag =
    feature.status === 'Enabled' ? <span className="tag green">Enabled</span>
    : feature.status === 'Enablement requested' ? <span className="tag amber">Enablement requested</span>
    : feature.status === 'Contact CSM' ? <span className="tag amber">Contact CSM</span>
    : <span className="tag outline">Disabled</span>;

  return (
    <>
      <nav className="crumb">
        <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>Dashboard</a>
        <i className="ph ph-caret-right" />
        <a href="/release-hub" onClick={(e) => { e.preventDefault(); navigate('/release-hub'); }}>Release Hub</a>
        <i className="ph ph-caret-right" />
        <b>Feature Details</b>
      </nav>

      <div className="detail-hero">
        <div className="tagrow">
          <span className="tag solid">{feature.featureTag}</span>
          <span className="tag outline">{feature.productModule}</span>
          {feature.published ? statusTag : <span className="tag amber">Unpublished</span>}
        </div>
        <h2>{feature.title}</h2>
        <p>{summary}</p>
        {more && <p>{more}</p>}
        <div className="hero-meta">
          <span>
            <i className="ph ph-calendar-blank" />
            {feature.published ? 'Released' : 'Planned for'} {formatDate(feature.prodEnablementDate)}
          </span>
          <span className="code">{feature.id}</span>
          <span><i className="ph ph-sliders-horizontal" />{feature.featureType}</span>
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <div className="panel">
            <h3>What's new</h3>
            <p>{[summary, more].filter(Boolean).join(' ')}</p>
            <h3 style={{ marginTop: 20 }}>What this helps you do</h3>
            <ul className="blist">
              {(feature.announcementBullets ?? []).map((b) => (
                <li key={b}><i className="ph ph-check-circle" /><span>{b}</span></li>
              ))}
            </ul>
            <button
              className="btn btn-primary btn-lg"
              onClick={() =>
                feature.productRoute
                  ? navigate(feature.productRoute)
                  : toast(`Opening ${feature.productModule} — this is where the capability lives.`)
              }
            >
              View it in the product <i className="ph ph-arrow-right" />
            </button>
          </div>
        </div>

        <div>
          <div className="panel">
            <h3>Release resources</h3>
            <div className="reslist">
              {feature.demoVideo && (
                <a className="reslink" href="#" onClick={(e) => { e.preventDefault(); openRes('Demo video', feature.demoVideo); }}>
                  <i className="ph ph-play" />Watch demo<i className="ph ph-arrow-square-out go" />
                </a>
              )}
              <a className="reslink" href="#" onClick={(e) => { e.preventDefault(); openRes('Release notes', feature.releaseNotes); }}>
                <i className="ph ph-book-open" />Read release notes<i className="ph ph-arrow-right go" />
              </a>
              {feature.configurationDoc && (
                <a className="reslink" href="#" onClick={(e) => { e.preventDefault(); openRes('Config document', feature.configurationDoc); }}>
                  <i className="ph ph-file-text" />Configuration document<i className="ph ph-arrow-square-out go" />
                </a>
              )}
            </div>
          </div>

          {isCreator && (
            <div className="panel">
              <h3>Adoption</h3>
              <dl style={{ margin: 0 }}>
                <div className="kv"><dt>Enabled customers</dt><dd className="tnum">{feature.enabledCustomers ?? 0}</dd></div>
                <div className="kv"><dt>Active customers</dt><dd className="tnum">{feature.activeCustomers ?? 0}</dd></div>
                <div className="kv"><dt>MAU (last 30 days)</dt><dd className="tnum">{(feature.mauLast30Days ?? 0).toLocaleString()}</dd></div>
                <div className="kv"><dt>DAU (30-day avg)</dt><dd className="tnum">{feature.dauLast30DayAvg ?? 0}</dd></div>
                <div className="kv"><dt>Feature flag</dt><dd style={{ fontWeight: 400, color: 'var(--tx3)' }}>{feature.productGate}</dd></div>
              </dl>
            </div>
          )}

          <div className="incl">
            <div className="ovl">Included in</div>
            <h4>{feature.releaseMonth} Release</h4>
            <p>{inRelease} features in this release.</p>
            <button
              className="btn btn-ghost"
              onClick={() => navigate(`/release-hub?month=${encodeURIComponent(feature.releaseMonth)}`)}
            >
              View this release <i className="ph ph-arrow-right" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FeatureDetail;

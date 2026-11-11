import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import UsageLink from '@/components/adoption/UsageLink';
import { adoptionUrl } from '@/lib/routes';
import { ArrowRight, BookOpen, Books, CaretRight, CheckCircle, FileText, Headset, Info, LockSimple, PlayCircle } from '@phosphor-icons/react';
import Hoverable from '@/components/primitives/Hoverable';
import { useFeatureStore } from '@/components/FeatureStore';
import { useUserRole } from '@/components/UserRoleProvider';
import { useReleaseNotesTarget, openNotesFile } from '@/components/ReleaseStore';
import { valueOf } from '@/data/features';
import { moduleByName, plural } from '@/data/knowledge';
import { statusOf } from '@/lib/featureUi';

/* ---------------------------------------------------------------------------
   A feature, from the Release Hub V2 design. The header (title, tag and
   status pills, facts row) is the hub header's; this is the body: the release
   note strip, What's new and Value delivered, and on the right Enablement (or
   Adoption for creators), Resources and, for creators, the feature flag.
   --------------------------------------------------------------------------- */

const card = { background: 'var(--card)', border: '1px solid var(--bd2)', borderRadius: 8 } as const;
const cardHead = { padding: '12px 16px', borderBottom: '1px solid var(--bd)', fontSize: 14, fontWeight: 700, color: 'var(--tx)' } as const;

const Note = ({ icon: Icon, title, text }: { icon: typeof Info; title: string; text: string }) => (
  <div style={{ display: 'flex', gap: 8, background: 'var(--su2)', borderRadius: 8, padding: '8px 12px', fontSize: 14, lineHeight: 1.5, color: 'var(--tx2)' }}>
    <Icon size={16} color="var(--tx3)" style={{ flex: 'none', marginTop: 3 }} />
    <span><b style={{ color: 'var(--tx)', fontWeight: 600 }}>{title}</b> {text}</span>
  </div>
);

const FeatureDetail = () => {
  const { featureId } = useParams();
  const navigate = useNavigate();
  const { visibleFeatures, isCreator, toggleEnabled } = useFeatureStore();
  const { userRole } = useUserRole();
  const f = visibleFeatures.find((x) => x.id === featureId);
  const notes = useReleaseNotesTarget(f?.releaseMonth ?? '');

  const sibs = useMemo(() => (f ? visibleFeatures.filter((x) => x.releaseMonth === f.releaseMonth && x.id !== f.id).length : 0), [f, visibleFeatures]);

  if (!f) {
    return (
      <div style={{ padding: '48px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)' }}>This feature isn't available</div>
        <div style={{ fontSize: 13, color: 'var(--tx3)', marginTop: 4 }}>It may be unpublished, or the link is out of date.</div>
      </div>
    );
  }

  const value = valueOf(f).slice(0, 3);
  const trail = [
    { label: 'Get help', path: '/product-hub/overview' },
    { label: 'Releases', path: '/product-hub/releases' },
    { label: f.title, path: `/product-hub/features/${f.id}` },
  ];
  const km = moduleByName(f.productModule);
  const resources: Array<{ icon: typeof Info; label: string; meta: string; onClick: () => void }> = [];
  if (f.published) resources.push({ icon: BookOpen, label: `${f.releaseMonth} release notes`, meta: 'PDF', onClick: () => (notes.file ? openNotesFile(notes.file) : navigate(notes.path)) });
  if (f.demoVideo) resources.push({ icon: PlayCircle, label: 'Demo video', meta: 'Video', onClick: () => toast(`Opening the ${f.title} demo`) });
  if (f.configurationDoc && isCreator) resources.push({ icon: FileText, label: 'Configuration document', meta: 'Internal', onClick: () => toast('Opening the configuration document') });
  if (km) resources.push({ icon: Books, label: `${f.productModule} guides`, meta: plural(km.docs.length, 'guide'), onClick: () => navigate(`/product-hub/knowledge/modules/${km.slug}`) });

  const enablement = () => {
    if (isCreator) {
      const stats: Array<[string, number | undefined]> = [
        ['Enabled customers', f.enabledCustomers], ['Active customers', f.activeCustomers],
        ['MAU · last 30 days', f.mauLast30Days], ['DAU · 30-day avg', f.dauLast30DayAvg],
      ];
      return (
        <>
          {!f.published && <Note icon={Info} title="Not live yet." text="Adoption appears once the feature is published." />}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--bd)', border: '1px solid var(--bd2)', borderRadius: 8, overflow: 'hidden' }}>
            {stats.map(([label, v]) => (
              <div key={label} style={{ background: 'var(--card)', padding: '10px 12px' }}>
                <div style={{ fontSize: 12, color: 'var(--tx3)' }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx)', fontVariantNumeric: 'tabular-nums' }}>
                  <UsageLink feature={f} metric={label} trail={trail}>{f.published ? (v ?? 0).toLocaleString('en-IN') : '-'}</UsageLink>
                </div>
              </div>
            ))}
          </div>
        </>
      );
    }
    const st = statusOf(f, userRole);
    if (st.kind === 'mandatory') return <Note icon={LockSimple} title="Enabled · Required by Zwayam." text="This feature is on for every customer and can't be turned off." />;
    if (st.kind === 'badge' && (st.label === 'Contact CSM' || st.label === 'Enablement requested'))
      return <Note icon={st.headset ? Headset : Info} title={`${st.label}.`} text={st.label === 'Contact CSM' ? 'Your customer success manager sets this up for you.' : 'Zwayam is turning this on for your organisation.'} />;
    const can = st.kind === 'toggle';
    const on = f.isEnabled;
    return (
      <div
        onClick={() => can && toggleEnabled(f.id)}
        title={can ? undefined : 'Only customer admins can change this'}
        style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: can ? 'pointer' : 'not-allowed' }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)' }}>{on ? 'On for your organisation' : 'Off for your organisation'}</div>
          <div style={{ fontSize: 13, color: 'var(--tx3)', lineHeight: 1.4 }}>
            {!can ? 'Only customer admins can change this.' : on ? 'Turn it off to hide it from everyone in your organisation.' : 'Turn it on to make it available to everyone in your organisation.'}
          </div>
        </div>
        <span
          role="switch"
          tabIndex={can ? 0 : -1}
          aria-checked={on}
          aria-disabled={!can}
          aria-label="Turn on for your organisation"
          onKeyDown={(e) => { if (can && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); toggleEnabled(f.id); } }}
          style={{ position: 'relative', display: 'inline-block', flex: 'none', width: 52, height: 28, borderRadius: 999, background: on ? 'var(--brand-solid)' : 'var(--switch-off)', opacity: can ? 1 : 0.42, transition: 'background 120ms ease' }}
        >
          <span style={{ position: 'absolute', top: 2, left: on ? 26 : 2, width: 24, height: 24, borderRadius: 999, background: 'var(--knob)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'left 120ms ease' }} />
        </span>
      </div>
    );
  };

  return (
    <section data-screen-label="Feature detail" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div role="note" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--brand-soft)', borderBottom: '1px solid var(--brand-border)', margin: '-16px -16px 0', padding: '8px 16px', fontSize: 13, color: 'var(--tx2)' }}>
        <Info size={16} color="var(--brand)" aria-hidden style={{ flex: 'none' }} />
        <span style={{ flex: 1, minWidth: 0 }}>
          Included in the <b style={{ color: 'var(--tx)', fontWeight: 600 }}>{f.releaseMonth}</b> release with {sibs ? plural(sibs, 'other feature') : 'no other features'}.
        </span>
        <a
          href={`/product-hub/releases?month=${encodeURIComponent(f.releaseMonth)}`}
          onClick={(e) => { e.preventDefault(); navigate(`/product-hub/releases?month=${encodeURIComponent(f.releaseMonth)}`); }}
          style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)', display: 'inline-flex', alignItems: 'center', gap: 4, flex: 'none' }}
        >
          View this release<CaretRight size={10} weight="bold" />
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 16, alignItems: 'start' }}>
        <div style={{ ...card, gridColumn: 'span 2', minWidth: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bd)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>What's new</div>
            <p style={{ margin: '4px 0 0', fontSize: 14, lineHeight: 1.5, color: 'var(--tx2)', textWrap: 'pretty' as never }}>{f.description || f.summary}</p>
          </div>
          {value.length > 0 && (
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>Value delivered</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {value.map((v) => (
                  <div key={v} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, lineHeight: 1.5, color: 'var(--tx2)' }}>
                    <CheckCircle size={18} weight="fill" color="var(--succ)" style={{ flex: 'none', marginTop: 1 }} />{v}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <div style={card}>
            <div style={{ ...cardHead, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ flex: 1 }}>{isCreator ? 'Adoption' : 'Enablement'}</span>
              {isCreator && f.published && (
                <Hoverable
                  as="a"
                  href={adoptionUrl({ feature: f.id })}
                  onClick={(e: React.MouseEvent) => { e.preventDefault(); navigate(adoptionUrl({ feature: f.id }), { state: { trail } }); }}
                  style={{ height: 28, padding: '0 8px', margin: '-4px -8px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}
                  hoverStyle={{ background: 'var(--brand-soft)' }}
                >
                  View adoption<ArrowRight size={12} weight="bold" />
                </Hoverable>
              )}
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>{enablement()}</div>
          </div>
          <div style={card}>
            <div style={cardHead}>Resources</div>
            <div style={{ padding: 4, display: 'flex', flexDirection: 'column' }}>
              {resources.map((r) => (
                <Hoverable
                  as="a"
                  href="#"
                  key={r.label}
                  onClick={(e: React.MouseEvent) => { e.preventDefault(); r.onClick(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 40, padding: '4px 12px', borderRadius: 8, fontSize: 14, fontWeight: 600, color: 'var(--brand)' }}
                  hoverStyle={{ background: 'var(--brand-soft)' }}
                >
                  <r.icon size={16} style={{ flex: 'none' }} />
                  <span style={{ flex: 1, minWidth: 0 }}>{r.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--tx3)' }}>{r.meta}</span>
                </Hoverable>
              ))}
              {resources.length === 0 && <div style={{ padding: 12, fontSize: 13, color: 'var(--tx3)' }}>No resources attached yet.</div>}
            </div>
          </div>
          {isCreator && f.productGate && (
            <div style={{ ...card, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx2)' }}>Feature flag (internal)</div>
              <code style={{ fontFamily: 'inherit', fontSize: 13, color: 'var(--tx)', background: 'var(--su2)', borderRadius: 6, padding: '4px 8px', alignSelf: 'flex-start' }}>{f.productGate}</code>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeatureDetail;

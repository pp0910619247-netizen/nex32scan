import { Card, Shell, langFrom } from '@/components/shell';
import { BlocksTable } from '@/components/blocks-table';
import { dictionary } from '@/i18n';
import { indexer } from '@/lib/explorer';
import { formatCount } from '@/lib/format';
import { toBlocksTableRows } from '@/lib/blocks-table-rows';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: { lang: string } }) {
  const lang = langFrom(params.lang);
  const t = dictionary(lang);
  const snapshot = await (await indexer()).snapshot();
  const rows = toBlocksTableRows(snapshot.quizBlocks ?? []);

  return (
    <Shell lang={lang}>
      <Card title={`${t.blocksPage} · ${formatCount(rows.length)}`} bodyClassName="">
        <BlocksTable lang={lang} rows={rows} />
      </Card>
    </Shell>
  );
}

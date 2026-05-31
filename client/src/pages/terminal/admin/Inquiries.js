import StubPage from '../../../components/terminal/StubPage';

export default function AdminInquiriesPage() {
  return (
    <StubPage
      title="Управување со барања"
      subtabs={['Нови', 'Распределени', 'Завршени']}
      blurb="Овде ќе се прегледуваат и одобруваат барањата што доаѓаат од сателитските сајтови пред да бидат пуштени на интерната табла за корисниците. (Корисничкиот интерфејс се гради во следниот чекор.)"
      showTrialNotice={false}
    />
  );
}

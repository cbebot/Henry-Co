import { savePathDefinitionAction } from "@/lib/learn/actions";
import { requireLearnRoles } from "@/lib/learn/auth";
import { getLearnSnapshot } from "@/lib/learn/data";
import { ownerNav } from "@/lib/learn/navigation";
import { LearnPanel, LearnWorkspaceShell } from "@/components/learn/ui";

export default async function OwnerPathsPage() {
  await requireLearnRoles(["academy_owner", "academy_admin", "content_manager", "internal_manager"], "/owner/paths");
  const snapshot = await getLearnSnapshot();

  return (
    <LearnWorkspaceShell
      kicker="Paths"
      title="Sequence courses into first-class academy tracks."
      description="Learning paths let HenryCo Learn present capability ladders instead of loose course lists."
      nav={ownerNav("/owner/paths")}
    >
      <LearnPanel className="rounded-[2rem]">
        <form action={savePathDefinitionAction} className="grid gap-4 md:grid-cols-2">
          <input name="title" placeholder="Path title" className="learn-input rounded-2xl px-4 py-3" required />
          <input name="slug" placeholder="Optional slug" className="learn-input rounded-2xl px-4 py-3" />
          <input name="audience" placeholder="Public vendors, support managers..." className="learn-input rounded-2xl px-4 py-3" />
          <select name="visibility" className="learn-select rounded-2xl px-4 py-3">
            <option value="public">Public</option>
            <option value="internal">Internal</option>
          </select>
          <select name="accessModel" className="learn-select rounded-2xl px-4 py-3">
            <option value="free">Free</option>
            <option value="paid">Paid</option>
            <option value="internal">Internal</option>
            <option value="sponsored">Sponsored</option>
          </select>
          <label className="flex items-center gap-3 rounded-2xl border border-[var(--learn-line)] px-4 py-3 text-sm text-[var(--learn-ink)]">
            <input type="checkbox" name="featured" className="h-4 w-4" />
            Featured path
          </label>
          <textarea name="summary" placeholder="Short summary" className="learn-textarea rounded-2xl px-4 py-3 md:col-span-2" rows={3} />
          <textarea name="description" placeholder="Path description" className="learn-textarea rounded-2xl px-4 py-3 md:col-span-2" rows={5} />
          <textarea name="courseIds" placeholder={snapshot.courses.map((course) => `${course.id} // ${course.title}`).join("\n")} className="learn-textarea rounded-2xl px-4 py-3 md:col-span-2" rows={6} />
          <div className="md:col-span-2">
            <button type="submit" className="learn-button-primary rounded-full px-5 py-3 text-sm font-semibold">Save path</button>
          </div>
        </form>
      </LearnPanel>

      <div className="space-y-5">
        {snapshot.paths.map((path) => (
          <LearnPanel key={path.id} className="rounded-[2rem]">
            <div className="font-semibold text-[var(--learn-ink)]">{path.title}</div>
            <p className="mt-2 text-sm text-[var(--learn-ink-soft)]">{path.visibility} • {path.accessModel}</p>
          </LearnPanel>
        ))}
      </div>
    </LearnWorkspaceShell>
  );
}

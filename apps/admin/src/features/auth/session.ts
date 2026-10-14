/**
 * Back-compat facades over the feature hooks (`hooks/queries|mutations`).
 * New code should import the hooks directly; these aliases keep existing
 * callers (`__root`, sidebar, gates, pages) untouched.
 */

import {
	useLoginMutation,
	useLogoutMutation,
} from "./hooks/mutations/use-auth.mutations";
import { useAdminQuery } from "./hooks/queries/use-admin.query";

export const useAdmin = useAdminQuery;
export const useLogin = useLoginMutation;
export const useLogout = useLogoutMutation;

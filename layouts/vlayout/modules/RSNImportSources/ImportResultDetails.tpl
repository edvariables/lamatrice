<table cellpadding="5" cellspacing="0" align="center" width="100%" class="dvtSelectedCell thickBorder importContents">
	<tr>
		<td>{'LBL_TOTAL_RECORDS_IMPORTED'|@vtranslate:$MODULE}</td>
		<td width="10%">:</td>
		<td width="30%"><b>{$IMPORT_RESULT.IMPORTED} / {$IMPORT_RESULT.TOTAL}</b>
			{if $IMPORT_RESULT.TOTAL}
				&nbsp;&nbsp;<i>soit {(int)($IMPORT_RESULT.IMPORTED / $IMPORT_RESULT.TOTAL * 100)}&nbsp;%</i>
			{/if}
		</td>
	</tr>
	<tr>
		<td>{'LBL_NUMBER_OF_RECORDS_CREATED'|@vtranslate:$MODULE}</td>
		<td width="10%">:</td>
		<td width="30%">{$IMPORT_RESULT.CREATED}</td>
	</tr>
	<tr>
		<td>{'LBL_NUMBER_OF_RECORDS_UPDATED'|@vtranslate:$MODULE}</td>
		<td width="10%">:</td>
		<td width="30%">{$IMPORT_RESULT.UPDATED}</td>
	</tr>
	<tr>
		<td>{'LBL_NUMBER_OF_RECORDS_SKIPPED'|@vtranslate:$MODULE}</td>
		<td width="10%">:</td>
		<td width="30%">{$IMPORT_RESULT.SKIPPED}
		{if $IMPORT_RESULT['SKIPPED'] neq '0'}
			&nbsp;&nbsp;<a class="cursorPointer" 
				onclick="return window.open('index.php?module={$MODULE}&view=List&mode=getImportDetails&type=skipped&start=1&foruser={$OWNER_ID}&for_module={$FOR_MODULE}','skipped','width=700,height=650,resizable=no,scrollbars=yes,top=150,left=200');">
			{'LBL_DETAILS'|@vtranslate:$MODULE}</a><!-- TMP Link -->
		{/if}
		</td>
	</tr>
	<tr>
		<td>{'LBL_NUMBER_OF_RECORDS_MERGED'|@vtranslate:$MODULE}</td>
		<td width="10%">:</td>
		<td width="10%">{$IMPORT_RESULT.MERGED}</td>
	</tr>
	<tr>
		<td>{'LBL_TOTAL_RECORDS_FAILED'|@vtranslate:$MODULE}</td>
		<td width="10%">:</td>
		<td width="30%">{if $IMPORT_RESULT.FAILED}<span style="color: red;">{$IMPORT_RESULT.FAILED}</span>{else}0{/if} / {$IMPORT_RESULT.TOTAL}
		{if $IMPORT_RESULT['FAILED'] neq '0'}
			&nbsp;&nbsp;<a class="cursorPointer" onclick="return window.open('index.php?module={$MODULE}&view=List&mode=getImportDetails&type=failed&start=1&foruser={$OWNER_ID}&for_module={$FOR_MODULE}','failed','width=700,height=650,resizable=no,scrollbars=yes,top=150,left=200');">{'LBL_DETAILS'|@vtranslate:$MODULE}</a><!-- TMP Link -->
		{/if}
		</td>
	</tr>
</table>
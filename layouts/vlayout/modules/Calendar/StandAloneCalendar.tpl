{*<!--
/*********************************************************************************
  ** The contents of this file are subject to the vtiger CRM Public License Version 1.0
   * ("License"); You may not use this file except in compliance with the License
   * The Original Code is:  vtiger CRM Open Source
   * The Initial Developer of the Original Code is vtiger.
   * Portions created by vtiger are Copyright (C) vtiger.
   * All Rights Reserved.
  *
 ********************************************************************************/
-->*}
<!DOCTYPE html>
<html>
	<head>
		<title>
			{vtranslate($PAGETITLE, $MODULE_NAME)}
		</title>
		<link REL="SHORTCUT ICON" HREF="favicon.ico">
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
{strip}
	{literal}<style type="text/css">


body {
 margin:0;
 font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;
 font-size:12px;
 line-height:18px;
 color:#333;
 background-color:#fff
}
table {
	margin-bottom: 2em;
    border-collapse: collapse;
}
caption {
	font-size: 20px;
	padding-bottom: 3px;
}

th, td {
    border: 1px solid #FAFAFA;
    border-top: 1px solid #CCCCCC;
    border-bottom: 1px solid #CCCCCC;
	text-align: center;
}

th {
	padding: 6px;
	width: 30px;
	text-align: center;
}

.dateday {
	font-size: 12px;
	display: inline-block;
}
.other_month .dateday{
	color:#999;
}
.busy_day {
}

.busy_flag {
	width:50%;
	background-color:#FFCCCC;
}

.busy_flag.morning {
	float: left;
}
.busy_flag.evening {
	float: right;
}


</style>{/literal}
</head>

<body>
	{assign var=MONTH value=$DATE_MIN->format('n')}
	{assign var=YEAR value=$DATE_MIN->format('Y')}
	{assign var=MAX_YEAR value=$DATE_MAX->format('Y')}
	{while $YEAR <= $MAX_YEAR}
		{while $MONTH <= 12}
			<table>
				<caption>{vtranslate('LBL_MONTH'|cat:$MONTH, 'Calendar')} {$YEAR}</caption>
				{assign var=DATE value=DateTime::createFromFormat('Y-n-d', $YEAR|cat:'-'|cat:$MONTH|cat:'-01')}
				{while $DATE->format('w') != 1}
					{assign var=TMP value=$DATE->sub($INTERVAL1DAY)}
				{/while}
				{assign var=FIRSTDATEMONTH value=$DATE->format('m')}
				<thead><tr>
					{for $WEEKDAY=1 to 7}
						{if $WEEKDAY eq 7}
							{assign var=DAY_NAME value=vtranslate('LBL_DAY0', 'Calendar')}
						{else}
							{assign var=DAY_NAME value=vtranslate('LBL_DAY'|cat:$WEEKDAY, 'Calendar')}
						{/if}
						<th>{substr($DAY_NAME, 0,3)}
						</th>
					{/for}
				</tr></thead>
				<tbody>
					{while $DATE->format('m') == $MONTH || $DATE->format('m') == $FIRSTDATEMONTH}
						<tr>
						{for $WEEKDAY=1 to 7}
							{$IS_BUSY=array_key_exists($DATE->format('Y-m-d'), $LISTVIEW_ENTRIES)}
							{assign var=OTHER_MONTH value=$DATE->format('n') != $MONTH}
							<td class="{if $IS_BUSY}busy_day {/if}{if $OTHER_MONTH}other_month {/if}">
								<span class="dateday">{$DATE->format('j')}</span>
								<div class="busy_block">
									{if $PREVIOUS_IS_BUSY}
										<span class="busy_flag morning">&nbsp;</span>
									{/if}
									{if $IS_BUSY}
										<span class="busy_flag evening">&nbsp;</span>
									{else}
										&nbsp;
									{/if}
								</div>
							</td>
							{$PREVIOUS_IS_BUSY=$IS_BUSY}
							{assign var=TMP value=$DATE->add($INTERVAL1DAY)}
						{/for}
						</tr>
					{/while}
				</tbody>
			</table>
		
			{$MONTH = $MONTH +1}
		{/while}
		{if $DATE > $DATE_MAX}
			{break}
		{/if}
		{$MONTH = 1}
		{$YEAR = $YEAR +1}
	{/while}
	
	</body>
</html>
{/strip}

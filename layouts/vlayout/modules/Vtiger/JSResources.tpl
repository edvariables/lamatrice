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


{* <script> resources below *}
	<script type="text/javascript" src="libraries/html5shim/html5.js"></script>

	<script type="text/javascript" src="libraries/jquery/jquery.blockUI.js"></script>
	<script type="text/javascript" src="libraries/jquery/chosen/chosen.jquery.min.js"></script><?php /*.min*/?>
	<script type="text/javascript" src="libraries/jquery/select2/select2.min.js"></script><?php /*.min*/?>
        <script>/* ED141011 - configuration du jquery/select2
                 * transpose la couleur des options de base dans le plugin
                 */
        $.fn.select2.defaults.__formatResult_original = $.fn.select2.defaults.formatResult;
        $.fn.select2.defaults.formatResult = function(result, container, query) {
            if (result && result.element && result.element.length && result.element[0].style.backgroundColor) {
                container.css('background-color', result.element[0].style.backgroundColor);
            }
            return this.__formatResult_original(result, container, query);
        }{* not called (overrided)
        $.fn.select2.defaults.__formatSelection_original = $.fn.select2.defaults.formatSelection;
        $.fn.select2.defaults.formatSelection = function(data, container) {
            var $select = $(this).parents(".select2-container:first").nextAll("select:first");
                var uicolor = $select.find('option[selected]').attr('uicolor');
                if ($uicolor) {
                    $(this).children('span:first').css('background-color', $uicolor);
                }
            return this.__formatSelection_original(data, container);
        }*}
        
        /** ED141011
         * when select2 is created, manage colors
         * Called on first load and when filter is selected
         * Pblm : $.select2 does not manage selected attribute
         */
        $('body').on('DOMNodeInserted', 'a.select2-choice', function () {
                var $select = $(this).parents(".select2-container:first").nextAll("select:first");
                var $this = $(this)
                , text = $this.text().trim()
                , $option;
                //search option with same text
                $select.find('option').each(function(){
                    if (text == $(this).text().trim()) {
                        $option = $(this);
                        return false;//break
                    }
                });
                if ($option){
                    var uicolor = $option[0].style.backgroundColor;
                    if (uicolor)
                        //$this.children('span:first').css('background-color', uicolor);
                        $this.css({ 'background-image': 'none', 'background-color': uicolor });
                    else
                        //$this.children('span:first').css('background-color', 'inherit');
                        $this.css({ 'background-image': 'inherit', 'background-color': 'inherit' });
                }
          });
        </script>
	<script type="text/javascript" src="libraries/jquery/jquery-ui/js/jquery-ui-1.8.16.custom.min.js"></script>
	<script type="text/javascript" src="libraries/jquery/jquery.class.min.js"></script>
	<script type="text/javascript" src="libraries/jquery/defunkt-jquery-pjax/jquery.pjax.js"></script>
	<script type="text/javascript" src="libraries/jquery/jstorage.min.js"></script>
	<script type="text/javascript" src="libraries/jquery/autosize/jquery.autosize-min.js"></script>

	<script type="text/javascript" src="libraries/jquery/rochal-jQuery-slimScroll/slimScroll.min.js"></script>
	<script type="text/javascript" src="libraries/jquery/pnotify/jquery.pnotify.min.js"></script>
	<script type="text/javascript" src="libraries/jquery/jquery.hoverIntent.minified.js"></script>

	<script type="text/javascript" src="libraries/bootstrap/js/bootstrap-alert.js"></script>
	<script type="text/javascript" src="libraries/bootstrap/js/bootstrap-tooltip.js"></script>
	<script type="text/javascript" src="libraries/bootstrap/js/bootstrap-tab.js"></script>
	<script type="text/javascript" src="libraries/bootstrap/js/bootstrap-collapse.js"></script>
	<script type="text/javascript" src="libraries/bootstrap/js/bootstrap-modal.js"></script>
	<script type="text/javascript" src="libraries/bootstrap/js/bootstrap-dropdown.js"></script>
	<script type="text/javascript" src="libraries/bootstrap/js/bootstrap-popover.js"></script>
	<script type="text/javascript" src="libraries/bootstrap/js/bootbox.min.js"></script>
	<script type="text/javascript" src="resources/jquery.additions.js"></script>
	<script type="text/javascript" src="resources/app.js"></script>
	<script type="text/javascript" src="resources/helper.js"></script>
	<script type="text/javascript" src="resources/Connector.js"></script>
	<script type="text/javascript" src="resources/ProgressIndicator.js" ></script>
	<script type="text/javascript" src="libraries/jquery/posabsolute-jQuery-Validation-Engine/js/jquery.validationEngine.js" ></script>
	<script type="text/javascript" src="libraries/guidersjs/guiders-1.2.6.js"></script>
	<script type="text/javascript" src="libraries/jquery/datepicker/js/datepicker.js"></script>
	<script type="text/javascript" src="libraries/jquery/dangrossman-bootstrap-daterangepicker/date.js"></script>
	<script type="text/javascript" src="libraries/jquery/jquery.ba-outside-events.min.js"></script>

    {*AV150723*}
  <!-- autocomplete lib -->
  <script type="text/javascript" src="resources/autocompletor/autocompletor.js"></script>
  <link rel="stylesheet" type="text/css" href="resources/autocompletor/autocompletor.css" media="screen" />

	{foreach key=index item=jsModel from=$SCRIPTS}
    <!-- {$jsModel->getSrc()}?&v={$VTIGER_VERSION} -->
		<script type="{$jsModel->getType()}" src="{$jsModel->getSrc()}?&v={$VTIGER_VERSION}"></script>
	{/foreach}

	{*ED141009*}
	<script type="text/javascript" src="libraries/jquery/colorpicker/js/colorpicker.js"></script>

	<!-- Added in the end since it should be after less file loaded -->
	<script type="text/javascript" src="libraries/bootstrap/js/less.min.js"></script>